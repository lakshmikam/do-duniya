"""Authored dramatic progression. All truth and unlocks remain server-owned."""


def enrich(cases):
    train, blue = cases['last-announcement'], cases['blue-carbuncle']
    train['hook'] = "At 23:47, Arun's own voice cleared the coach. Two minutes later, he wrote that he was following a thief. Now he is missing."
    blue['hook'] = 'An innocent man faces prison. The only witness that can clear him is a Christmas goose.'
    train['brief'] = train['hook'] + ' You have one express held at Vayal Junction, a missing museum instrument, and accounts that do not agree. One of you walks the station; the other tests the paperwork. Find Arun and reconstruct what the announcement concealed.'
    blue['brief'] = blue['hook'] + ' A stolen jewel has turned up inside Henry Baker’s dinner. Follow the bird through London while your partner tests the hotel accusation. Connect the two trails before you put another name on the charge sheet.'
    train['description'] = 'The missing station master’s voice is still on the loudspeaker. Was he giving an order, or being used as an alibi?'
    blue['description'] = 'A stolen jewel, two identical birds, and an arrest built on one man’s word. Follow the handovers and make the witnesses answer.'

    def evidence(c, id): return next(e for e in c['evidence'] if e['id'] == id)
    evidence(train, 'broadcast')['text'] = 'At 23:47 the console played file E-14 locally: an evacuation drill Arun recorded in 2019. Everyone heard his voice, but he was not speaking live. The recording ordered the luggage aisle cleared.'
    evidence(train, 'receipt')['text'] = 'The signed tea-delivery receipt places Leela in the canteen from 23:46 to 23:51 by the radio clock. It contradicts her claim that she stayed beside the coach, but does not show who moved the crate.'
    evidence(train, 'found')['text'] = 'Arun is alive behind the relay-store door. He followed an unauthorized trolley movement; Dev shut him inside when he challenged it. The crate is under a tarpaulin at the west loading bay.'
    for id, title, text, role, location in [
        ('leela_admission', 'The paid tea break', 'Leela admits Dev gave her 500 rupees to leave the trolley and take a tea break. She thought he wanted an unofficial shortcut, not a theft. The corrected clock explains why she feared her canteen visit would incriminate her.', 'field', 'platform'),
        ('mira_admission', 'A key lent in trust', 'Mira admits lending Dev the broadcast key for what he called a system test. Leela’s paid absence makes her realize the favors were arranged together. She concealed the loan to protect her job; she did not authorize the theft.', 'archive', 'console'),
    ]:
        train['evidence'].append(dict(id=id,title=title,text=text,role=role,location=location,kind='testimony',requires=[]))
    # No new crowded scenes. Arun is met only after the store is opened.
    train['characters'].append(dict(id='arun',name='Arun Sen',occupation='Station master',role='field',location='relay',requires=['found'],initial='I recorded that drill to keep people safe. Tonight someone used my voice to empty the coach. Thank you for opening the door.',voice_profile=dict(voice='Prakash',speed=.93,tag='',tone='Exhausted, dignified, with dry humour.',fallback='I can tell you what I saw in the passage. I cannot speak for what happened at the console.'),responses=[dict(id='rescue',label='Ask what happened behind the door',text='I checked the collection with dispatch. No night pickup. I followed the trolley; Dev shut the store door on me. I could hear the crate rolling on toward the west bay.',reveals=None,requires=['found']),dict(id='voice',label='Ask about hearing his own voice',text='A safety drill from years ago. A recording can borrow a man’s voice; it cannot borrow his permission.',reveals=None,requires=['found'])]))
    blue['characters'].append(dict(id='oakshott',name='Mrs Oakshott',occupation='Goose keeper',role='field',location='brixton',initial='You are the second person asking about that batch. My brother wanted one bird in particular. I told him there were two with that tail.',voice_profile=dict(voice='Vasudha',speed=.98,tag='',tone='Warm, practical, proud of her birds.',fallback='I know my birds and who took them. I know nothing about a hotel jewel.'),responses=[dict(id='twins',label='Ask about the two barred tails',text='Two white geese, both with a bar across the tail. My brother James took one. The other went in Breckinridge’s batch. Markings alone would not tell them apart.',reveals='twins',requires=['supplier']),dict(id='brother',label='Ask who her brother is',text='James Ryder. Usually too particular for a muddy yard. That day he could not keep his hands off the birds.',reveals=None,requires=['supplier'])]))

    def claim(id, ch, text, against=(), supports=()):
        return dict(id=id,character_id=ch,text=text,contradicted_by=list(against),supported_by=list(supports))
    train['claims'] = [
        claim('dev_pickup','dev','The museum authorized an urgent collection tonight.',['docket']),
        claim('dev_office','dev','I stayed in the parcel office. I could not have used the broadcast cupboard.',['access']),
        claim('dev_seal','dev','The storm split the seal. Nobody cut it.',['seal']),
        claim('leela_coach','leela','I stayed beside the luggage coach throughout the announcement.',['receipt']),
        claim('mira_control','mira','That warning came live from control.',['broadcast']),
        claim('mira_key','mira','Nobody borrowed the broadcast key from me.',['access']),
    ]
    blue['claims'] = [
        claim('baker_dinner','henry','A replacement goose is enough. I do not need the remains of the original.',supports=['baker']),
        claim('dealer_source','dealer','That batch came from Essex. No local supplier to trace.',['supplier']),
        claim('oakshott_birds','oakshott','James took one barred-tailed bird. The other went to the market.',supports=['twins']),
        claim('ryder_bird','james','I have never asked anyone here about a goose.',['visitor']),
        claim('ryder_access','james','Only Horner had access to the room. Nobody else could have taken the jewel.',['ryder']),
        claim('brad_proof','inspector','The accusation and the maid’s statement prove Horner took it.',['arrest','cusack']),
    ]
    def stage(level, speech, pairs=(), known=(), grants=()):
        return dict(level=level,speech=speech,requires_challenges=[list(x) for x in pairs],requires_known=list(known),grants=list(grants),emotion='cracked' if level==2 else 'nervous')
    stages = {
        'dev': [stage(1,'That approval is for the morning. A clerical mix-up, perhaps. It does not put me at the console.', [('dev_pickup','docket')]),stage(2,'All right. I played Arun’s old drill. His voice made everyone obey. I meant to sell the instrument; when he followed, I locked him in the store. The crate is at the west bay.', [('dev_pickup','docket'),('dev_office','access')],['docket'],['admission'])],
        'leela': [stage(1,'Yes, I was in the canteen. I hid that because the times looked terrible. Check the platform clock before you decide I moved the crate.', [('leela_coach','receipt')]),stage(2,'Four minutes slow? Then the receipt really does cover that interval. Dev paid me 500 rupees to leave the trolley and take tea. I did not know what he meant to do.', [('leela_coach','receipt')],['clock'],['leela_admission'])],
        'mira': [stage(1,'E-14. Arun’s old drill. I recognized his voice and assumed it was control. I should have checked the playback light.', [('mira_control','broadcast')]),stage(2,'Leela was paid to leave? Then this was arranged. I lent Dev the key for a system test. When Arun vanished I was afraid the loan would cost my job. I am putting it on the record now.', [('mira_control','broadcast'),('mira_key','access')],['leela_admission'],['mira_admission'])],
        'dealer': [stage(1,'All right, Brixton, not Essex. Mrs Oakshott supplied them. And a fellow calling himself Ryder keeps coming back for a barred-tailed bird. Ask him why a replacement will not do.', [('dealer_source','supplier')],['alpha'],['visitor'])],
        'james': [stage(1,'I was asking for a friend. You need not make a public matter out of one Christmas bird.', [('ryder_bird','visitor')]),stage(2,'I took the stone. I hid it in a goose at my sister’s yard and took the wrong bird. Two barred tails. All that time I was chasing my own mistake. Horner did not steal it.', [('ryder_bird','visitor'),('ryder_access','ryder')],['stone','supplier'],['confession'])],
        'inspector': [stage(1,'You are right: neither record puts the jewel in Horner’s hands. I need a chain connecting the room to the recovered bird, not a second confident accusation.', [('brad_proof','arrest'),('brad_proof','cusack')]),stage(2,'The market visitor is our hotel accuser, and the two birds explain the mistake. I will correct the charge sheet. Horner’s name comes off it.', [('brad_proof','arrest'),('brad_proof','cusack')],['visitor','twins','ryder'],[])],
    }
    initials = {
        'dev':'The museum phoned. Urgent pickup. The storm split the seal, and I was in the parcel office when the warning sounded. Ask anyone.',
        'leela':'I stayed beside the luggage coach. I saw nothing. Please, I cannot lose this job over someone else’s parcel.',
        'mira':'A live warning from control. Arun’s voice, unmistakable. Nobody borrowed the cupboard key from me tonight.',
        'dealer':'Essex birds. Every one. No local supplier for you to bother. I sell dinner, not mysteries.',
        'james':'Horner was the only man with access. As for this market, I have never asked anyone here about a goose.',
        'inspector':'We have Ryder’s accusation and the maid’s statement. Surely that is enough to keep Horner charged.',
    }
    # Replace conflicting old topic lines. Topic presentation remains an authored shortcut,
    # but all stage transitions use exactly the same server challenge evaluation.
    updates = {
        'dev': {'timing':'There was rain, shouting, luggage. Then Arun’s voice came over the speaker. I was in the parcel office. That is my account.', 'collection':'The docket should settle it. An urgent collection, authorized tonight.'},
        'leela': {'where':'Beside the coach. If there is a canteen receipt, check its times before making assumptions.', 'trolley':'Dev asked me to put it beside the coach. What he loaded is something you must ask him.'},
        'mira': {'local':'Local playback is possible with the cupboard key. But I say this warning came from control.', 'time':'The platform clock runs slow. Use the maintenance note and radio-clock records to compare times.'},
        'dealer': {'source':'I said Essex. If you believe the book says otherwise, show me the account.', 'visitor':'A visitor? Put a specific question to my account before asking me to gossip.'},
        'james': {'bird':'I have not been asking after a bird. You must mean someone else.'},
        'inspector': {'evidence':'The charge rests on Ryder’s account and Cusack hearing his alarm. If either record is weaker than I say, show me.', 'access':'Ryder worked here, naturally. I still consider Horner the most likely suspect.'},
    }
    for c in cases.values():
        for ch in c['characters']:
            ch['stages'] = stages.get(ch['id'], [])
            if ch['id'] in initials: ch['initial'] = initials[ch['id']]
            for a in ch['responses']:
                if a['id'] in updates.get(ch['id'], {}):
                    a['text'] = updates[ch['id']][a['id']]
                    a['stage_sensitive'] = True
                # Old ungated colour must never contradict the current stage or reveal favors.
                if ch['id']=='leela' and a['id']=='blame':
                    a['text'] = ch['initial'] + ' If you have a record that contradicts me, show me the particular passage.'
                    a['stage_sensitive'] = True
                if ch['id']=='james' and a['id'] in {'pressure','markings','privacy','delay'}:
                    a['text'] = 'You have mistaken me for someone else. I am here on hotel business. If you think otherwise, show me who says so.'
                    a['stage_sensitive'] = True
                if ch['id']=='dealer' and a['id']=='visitor':
                    a['requires']=['supplier','alpha']
                    a['label']='Present the supplier account and ask about the visitor'
                if ch['id']=='james' and a['id']=='confront':
                    a['requires']=['stone','supplier','ryder','visitor']
    train['beats'] = [dict(at_minute=5,message='Rain hammers the roof. Under the recording, someone remembers a second sound: a trolley turning away.'),dict(at_minute=10,message='Control is asking when the express can leave. The hold remains until your investigation is complete.'),dict(at_minute=14,message='Dev keeps watching the west end of the platform. The loading bay is still dark.',character='dev')]
    blue['beats'] = [dict(at_minute=8,message='The market shutters are coming down. Someone is still asking for one particular bird.'),dict(at_minute=14,message='A telegram arrives: Horner’s transfer is scheduled for tomorrow. Bradstreet needs a checked account, not a guess.')]
    train['epilogue'] = dict(question='The theft is solved. How will you record the favors that made it possible?',options=[dict(id='report',label='Record every favor',text='Your report names the paid tea break and the borrowed key. Leela and Mira face a formal inquiry, with their cooperation and the limits of their knowledge recorded.'),dict(id='protect',label='Ask for leniency',text='You record every fact, including the payment and the loan, and recommend leniency for the witnesses who helped expose the theft. The railway board must still decide.')],closing='Arun: “I recorded that drill so people would be safe. Tonight it was used to rob them. At least the last word was ours.”')
    blue['epilogue'] = dict(question='Horner is cleared. How should Ryder’s confession enter the public record?',options=[dict(id='public',label='A public hearing',text='The evidence and confession go to an open hearing. Horner’s name is cleared publicly; Ryder must answer in court.'),dict(id='private',label='A signed private statement',text='Ryder signs a full statement for Bradstreet. The evidence clears Horner without a spectacle at the market. It does not erase the theft or decide Ryder’s legal fate.')],closing='Bradstreet: “We nearly mistook an accusation for a fact. This time the record will say how we know.”')
    train['solution']['reveal'] = 'Dev played a 2019 safety drill in Arun’s voice to empty the luggage aisle. A false night-collection instruction hid the theft; the museum had authorized only a morning pickup. Arun followed the trolley and Dev locked him in the relay store. The crate is recovered at the west bay. Leela’s receipt clears her of moving the crate. If you tested their accounts, the paid tea break and borrowed key explain how ordinary favors helped the plan.'
    train['hints'] = ['Compare the announcement log with the claim of a live warning. Whose voice was borrowed?', 'Compare Leela’s whereabouts with the receipt and ask your partner which clock is reliable.', 'An urgent-pickup claim and a parcel-office alibi can be tested with two different records. Find Arun before the final decision.']
    blue['hints'] = ['A charge sheet records an accusation. Compare what the attendant and maid actually establish.', 'Compare the dealer’s claimed source with his supplier account. Follow the recorded handovers.', 'The market visitor and hotel accuser share a name. Test his denial about the bird and his account of room access.']
