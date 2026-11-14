"""Deterministic witness challenges, story clock and shared epilogues.

Never serialize stage requirements, secret lines or valid challenge pairs.
"""
import time
from fastapi import Header
from pydantic import BaseModel, Field

RESPONSE_LINES = {
    'Let me gather my thoughts. You can check the evidence or speak to someone else, then come back.',
    'Let me gather my thoughts. Check the records and come back shortly.',
    'That does contradict my account. There is more to explain; compare the rest of the records before you decide.',
    'Yes. That record supports what I told you.',
    'That passage does not contradict what I said. Show me the part that does.',
}


def state(room, character):
    legacy_grants={'dev':'admission','james':'confession','leela':'leela_admission','mira':'mira_admission'}
    initial=2 if legacy_grants.get(character) in room.get('shared',[]) else 0
    return room.setdefault('witness_states', {}).setdefault(character, dict(stage=initial,pressure=0,updated=time.time(),clamped_until=0))


def calm(s, now=None):
    now = time.time() if now is None else now
    steps = int(max(0, now - s['updated']) // 30)
    if steps:
        s['pressure'] = max(0, s['pressure'] - 5 * steps)
        s['updated'] += steps * 30
    return s


def public_state(room, ch):
    s = calm(state(room, ch['id']))
    level = s['stage']
    stage = next((x for x in ch.get('stages',[]) if x['level']==level),{})
    return dict(stage=level,emotion=stage.get('emotion','nervous' if ch['id'] in room.get('beat_nervous',[]) else 'neutral'),demeanor='quiet' if s['clamped_until']>time.time() else 'tense' if s['pressure']>=45 else 'calm',clamped=s['clamped_until']>time.time())


def lines(room, ch):
    s=state(room,ch['id'])
    stage=next((x for x in ch.get('stages',[]) if x['level']==s['stage']),None)
    return stage['speech'] if stage else ch['initial']


def encounter(room, ch, case):
    statements=room.setdefault('statements',{})
    for claim in case.get('claims',[]):
        if claim['character_id']==ch['id']:
            statements.setdefault(claim['id'],dict(id=claim['id'],character_id=ch['id'],character=ch['name'],role=ch['role'],text=claim['text'],status='unchallenged',evidence_ids=[]))


def evaluate(game, room):
    changed=True
    while changed:
        changed=False
        pairs={tuple(x) for x in room.get('challenges',[])}
        for ch in game.case(room)['characters']:
            s=state(room,ch['id'])
            for stage in ch.get('stages',[]):
                if stage['level']<=s['stage']: continue
                if not set(map(tuple,stage.get('requires_challenges',[])))<=pairs: continue
                if not set(stage.get('requires_known',[]))<=set(room['shared']): continue
                s['stage']=stage['level']; changed=True
                owner=next((p for p in room['players'] if p['role']==ch['role']),room['players'][0])
                owner={**owner,'role':ch['role']}
                for id in stage.get('grants',[]): game.discover(room,owner,id)
                game.event(room,f"{ch['name']} changes their account. Review the testimony together.")


def challenge(game, room, player, ch, claim_id, evidence_id):
    encounter(room,ch,game.case(room))
    claim=next((x for x in game.case(room).get('claims',[]) if x['id']==claim_id and x['character_id']==ch['id']),None)
    if not claim: game.fail('Choose a statement this witness actually made.',400)
    if evidence_id not in room['shared']: game.fail('Discover that evidence before presenting it.',403)
    s=calm(state(room,ch['id']))
    if s['clamped_until']>time.time():
        return dict(result='quiet',text='Let me gather my thoughts. You can check the evidence or speak to someone else, then come back.',**public_state(room,ch))
    pair=[claim_id,evidence_id]
    entry=room['statements'][claim_id]
    if evidence_id in claim.get('contradicted_by',[]):
        if pair not in room.setdefault('challenges',[]): room['challenges'].append(pair)
        entry['status']='contradicted'
        if evidence_id not in entry['evidence_ids']: entry['evidence_ids'].append(evidence_id)
        before=s['stage']; evaluate(game,room)
        text=lines(room,ch) if s['stage']>before else 'That does contradict my account. There is more to explain; compare the rest of the records before you decide.'
        return dict(result='contradiction',text=text,**public_state(room,ch))
    if evidence_id in claim.get('supported_by',[]):
        entry['status']='supported'
        if evidence_id not in entry['evidence_ids']: entry['evidence_ids'].append(evidence_id)
        return dict(result='supported',text='Yes. That record supports what I told you.',**public_state(room,ch))
    # Replaying the same mistake does not rack up pressure.
    if pair not in room.setdefault('wrong_challenges',[]):
        room['wrong_challenges'].append(pair)
        s['pressure']=min(100,s['pressure']+15)
        if s['pressure']>=100:
            s['clamped_until']=time.time()+45
    return dict(result='no_effect',text='That passage does not contradict what I said. Show me the part that does.',**public_state(room,ch))


def tick(game, room):
    if room['status']!='playing': return
    fired=room.setdefault('story_beats',[])
    for i,beat in enumerate(game.case(room).get('beats',[])):
        if i not in fired and game.elapsed(room)>=beat['at_minute']*60:
            fired.append(i)
            room['story_banner']=beat['message']
            if beat.get('character'):
                room.setdefault('beat_nervous',[]).append(beat['character'])
            game.event(room,beat['message'])
            room['revision']+=1


def epilogue_view(game, room, player):
    if not room.get('result',{}).get('success'): return None
    config=game.case(room).get('epilogue')
    if not config: return None
    votes=room.get('epilogue_votes',{})
    choices=set(votes.values())
    agreed=len(votes)==len(room['players']) and len(choices)==1
    chosen=next((x for x in config['options'] if x['id'] in choices),None) if agreed else None
    return dict(question=config['question'],options=[dict(id=x['id'],label=x['label']) for x in config['options']],your_choice=votes.get(player['id']),votes=[dict(name=p['name'],choice=votes.get(p['id'])) for p in room['players']],agreed=agreed,text=chosen['text'] if chosen else None,closing=config['closing'] if agreed else None)


class Challenge(BaseModel):
    character: str=Field(max_length=40)
    claim_id: str=Field(max_length=80)
    evidence_id: str=Field(max_length=80)


class Choice(BaseModel):
    choice: str=Field(max_length=40)


def install(app, game):
    def reachable(room, player, id):
        ch=next((c for c in game.case(room)['characters'] if c['id']==id and c['role']==player['role']),None)
        if not ch or not game.unlocked(room,player,ch): game.fail('That witness is not available to this role.',403)
        location=next(l for l in game.case(room)['locations'] if l['id']==ch['location'])
        if not game.unlocked(room,player,location): game.fail('Follow the earlier lead to reach this witness.',403)
        return ch

    @app.post('/api/rooms/{code}/challenge')
    async def present(code: str, body: Challenge, authorization: str=Header(default='')):
        with game.LOCK:
            room,player=game.auth(code,authorization)
            if room['status']!='playing': game.fail('Resume the investigation before presenting evidence.',409)
            ch=reachable(room,player,body.character)
            result=challenge(game,room,player,ch,body.claim_id,body.evidence_id)
            room.setdefault('story_replies',[]).append(result['text'])
            room['story_replies']=room['story_replies'][-30:]
            room['revision']+=1; game.save(room)
        await game.publish(room)
        return {**result,'room':game.view(room,player)}

    @app.post('/api/rooms/{code}/encounter')
    async def meet(code: str, body: game.Ask, authorization: str=Header(default='')):
        with game.LOCK:
            room,player=game.auth(code,authorization)
            if room['status']!='playing': game.fail('Resume the case to speak to a witness.',409)
            ch=reachable(room,player,body.character)
            encounter(room,ch,game.case(room))
            room['revision']+=1
            game.save(room)
            response=dict(text=lines(room,ch),room=game.view(room,player))
        await game.publish(room)
        return response

    @app.get('/api/rooms/{code}/statements')
    def statements(code: str, authorization: str=Header(default='')):
        with game.LOCK:
            room,player=game.auth(code,authorization)
            return list(room.get('statements',{}).values())

    @app.post('/api/rooms/{code}/talk')
    async def talk(code: str, body: game.Ask, authorization: str=Header(default='')):
        import asyncio
        import os
        from fastapi import HTTPException
        with game.LOCK:
            room,player=game.auth(code,authorization)
            if room['status']!='playing': game.fail('Resume the investigation to ask a question.',409)
            ch=reachable(room,player,body.character)
            encounter(room,ch,game.case(room))
            current=public_state(room,ch)
        if body.topic:
            return await game.ask(code,body,authorization)
        if os.getenv('GEMINI_CHARACTERS','on')!='off' and os.getenv('GEMINI_API_KEY') and not current['clamped']:
            try:
                timeout=max(1,min(15,float(os.getenv('GEMINI_TIMEOUT_SECONDS','8'))))
                # The existing adapter selects only an available authored reply.
                # This stricter boundary cannot invent facts or leak generated prose.
                return await asyncio.wait_for(game.ask(code,body,authorization),timeout)
            except (HTTPException, asyncio.TimeoutError, ValueError):
                pass
        with game.LOCK:
            # Revalidate after a provider wait or role switch.
            room,player=game.auth(code,authorization)
            if room['status']!='playing': game.fail('The investigation changed. Resume before asking again.',409)
            ch=reachable(room,player,body.character)
            text=lines(room,ch) if not public_state(room,ch)['clamped'] else 'Let me gather my thoughts. Check the records and come back shortly.'
            recent=room.setdefault('conversations',{}).setdefault(player['id'],{}).setdefault(ch['id'],[])
            recent.append(dict(question=body.question,topic='authored-fallback',answer=text)); del recent[:-8]
            room['revision']+=1
            game.save(room)
        await game.publish(room)
        return dict(text=text,provider='authored',speaker=ch['name'],evidence=None,fallback=True)

    @app.post('/api/rooms/{code}/pulse')
    async def pulse(code: str, authorization: str=Header(default='')):
        with game.LOCK:
            room,player=game.auth(code,authorization)
            tick(game,room); game.save(room)
        await game.publish(room)
        return game.view(room,player)

    @app.post('/api/rooms/{code}/epilogue')
    async def choose(code: str, body: Choice, authorization: str=Header(default='')):
        with game.LOCK:
            room,player=game.auth(code,authorization)
            config=game.case(room).get('epilogue')
            if not room.get('result',{}).get('success') or not config: game.fail('Solve the case before choosing its epilogue.',409)
            if body.choice not in {x['id'] for x in config['options']}: game.fail('Choose one of the epilogue options.')
            if epilogue_view(game,room,player)['agreed']: game.fail('Your team has already agreed on the epilogue.',409)
            room.setdefault('epilogue_votes',{})[player['id']]=body.choice
            room['revision']+=1; game.save(room)
        await game.publish(room)
        return game.view(room,player)
