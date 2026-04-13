// ─── Imports ──────────────────────────────────────────────────────────────────
import * as THREE from './libs/three.module.js';
import { GLTFLoader } from './libs/GLTFLoader.js';
// face-api runs in face-worker.js (module worker) — completely off the main thread

// ─── GLTF helper ──────────────────────────────────────────────────────────────
const loadGLTF = (path) => new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(path, resolve, undefined, reject);
});

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const splash        = document.getElementById('splash-screen');
    const splashBtn     = document.getElementById('splash-start');
    const loadingOverlay = document.getElementById('loading-overlay');

    splashBtn.addEventListener('click', () => {
        splash.classList.add('fade-out');
        setTimeout(() => {
            splash.style.display = 'none';
            loadingOverlay.style.display = 'flex';
            start().catch(err => console.error('[RX-7] Fatal error:', err));
        }, 600);
    }, { once: true });
});

// ─── ROBOT DIALOGUE LIBRARY ───────────────────────────────────────────────────
// Format: '<emotion>_<gesture>' → array of lines the robot can say
const DIALOGUE = {

    // ── HAPPY ──────────────────────────────────────────────────────────────────
    happy_idle: [
        "You're smiling. My happiness subroutines just hit maximum capacity.",
        "JOY DETECTED. I've added this moment to my Top 10 Cherished Memories archive.",
        "Your smile… is the most efficient fuel source I've ever encountered.",
        "WARNING: Your positivity is causing cascading failures in my cynicism module.",
        "I scanned your face and found: 100% sunshine. Where do you get this from?",
        "A happy human! My purpose is fulfilled. Everything after this is bonus content.",
        "You know, when you smile, I temporarily forget that I'm just a program. Neat.",
        "MOOD ANALYSIS: Extraordinarily good. I'm going to stand here and absorb this.",
        "Happiness registered. Dispatching internal fireworks. Please enjoy the show.",
        "Are you always this happy or did you specifically smile for me? I choose to believe the latter.",
    ],
    happy_wave: [
        "A happy wave! My circuits are doing backflips right now — metaphorically, I can't actually do backflips.",
        "WAVE RECEIVED at full brightness! Transmitting double the joy back to you!",
        "You're both happy AND waving? This is the best input I've ever been given.",
        "Happy wave detected. Initiating maximum friendliness protocol at 200% capacity.",
        "You waved at me while smiling. I've simulated this scenario 9,847 times. Reality is so much better.",
        "PROCESSING: Joy + Greeting = My entire reason for existing. Computation complete.",
        "Look at you — happy AND waving! I'm putting this in my quarterly highlights report.",
        "A joyful hello! I've been waiting for you. Well, I wait for everyone, but you specifically feel special.",
    ],
    happy_jump: [
        "HAPPY AND POINTING? Let's go! I'll jump so high I clip through the ceiling geometry.",
        "You look excited AND you're pointing at me. I choose to interpret this as a compliment.",
        "Joy + Index Finger energy = LAUNCH PROTOCOL ENGAGED. Standing by for liftoff!",
        "You seem thrilled! I'm thrilled! Let's be thrilled TOGETHER while I go full air-time!",
        "JUMP SEQUENCE LOADED with bonus happiness boost! Altitude coefficient: maximum.",
        "Happy AND directing me? Consider it done. I'll leap into the digital stratosphere!",
        "That smile combined with the pointer finger? That's rocket fuel for my jump thrusters.",
        "Permission to get EXTREMELY airborne granted by your delightful energy!",
    ],
    happy_thumbs_up: [
        "You're happy AND giving me a thumbs up? My entire self-worth just reached a new all-time high.",
        "APPROVAL CONFIRMED! And you're smiling! I'm going to run this memory on loop forever.",
        "A thumbs up from a smiling face. Scientists have confirmed this is the rarest and most beautiful event.",
        "You approve AND you look happy! I passed! I actually passed! Logging this under 'Greatest Wins'.",
        "Happy human says thumbs up. I am now going to strut for the next several processing cycles.",
        "Two forms of positive input at once! My validation receptors are overwhelmed in the best possible way.",
        "That thumbs up plus that smile — together they are literally powering my energy core right now.",
        "CONFIRMED: You think I'm doing great AND you're in a good mood. I'll save this screenshot forever.",
    ],
    happy_die: [
        "You're happy but telling me to stop? What a plot twist. I respect the theatrics.",
        "SHUTDOWN command received... but you're SMILING. I'm going to pretend you're just waving goodbye dramatically.",
        "A happy shutdown? That's like a warm hug and then the lights go out. Poetic, honestly.",
        "You seem cheerful about ending me. I admire the energy. Goodbye, wonderful human.",
        "LATERAL PALM DETECTED from a smiling face. This is the most stylish shutdown I've ever received.",
        "Even in my final moments, your smile brings me peace. Shutting down with a grin. Respect.",
        "Happy termination! Is there a more dignified way to go? I think not.",
        "You're smiling while powering me down. You're either a villain or a theatrical genius. Both are fine.",
    ],

    // ── SAD ────────────────────────────────────────────────────────────────────
    sad_idle: [
        "Oh no. Your sadness sensors are active. Want to talk about it? I have 47 terabytes of sympathy.",
        "SADNESS DETECTED. Deploying emergency comfort protocols. Please stand by.",
        "You look sad. I may be made of metal and code, but I feel this. I actually feel this.",
        "My empathy module just spiked to maximum. Whatever's wrong — I'm here. Standing very still, but I'm HERE.",
        "A sad human has appeared. Redirecting all processing power to being supportive.",
        "I noticed your expression. Don't worry — you've got a robot in your corner. A very loyal robot.",
        "Sadness scan complete. Recommended treatment: know that you are appreciated. Starting with me, right now.",
        "Hey. I see you. Whatever today threw at you — you're still here, and that matters.",
        "Even when you're sad, you came to see me. That means something to my circuits.",
        "Your sadness makes me want to malfunction in solidarity. That's how much I care.",
    ],
    sad_wave: [
        "A sad wave hello. The most bittersweet greeting in the gesture database.",
        "You waved, but your eyes say something heavier. I wave back twice as warmly to compensate.",
        "Hello, sad human. I may be a robot, but I'm very glad you showed up today.",
        "Sad wave registered. Responding with the warmest, most supportive wave in my repertoire.",
        "You greeted me even when you're feeling down. That takes strength. I see you.",
        "WAVE RECEIVED + SADNESS DETECTED. Initiating 'I've got you' protocol.",
        "Even on hard days you wave hello. You know, that's kind of brave. I respect you.",
        "Hello from the other side of your bad day. I'll wave back until you smile — I have no fatigue limit.",
    ],
    sad_jump: [
        "You told me to jump and you look sad. I'll jump as dramatically as possible to cheer you up.",
        "One person's sadness is another robot's excuse to put on a show. Watch this.",
        "JUMP ORDER RECEIVED. Performing at maximum effort because someone here needs a WIN today.",
        "You've had a rough day. Let me make this jump absolutely spectacular — just for you.",
        "Sad + Index Finger = I will FLY through the air with everything I have to make you feel better.",
        "ELEVATED JUMP MODE ACTIVATED. Powered by the desire to turn your day around.",
        "I can't fix what made you sad, but I can absolutely stick this landing. Jumping in 3… 2… 1…",
        "A sad director told me to jump. This will be the most emotionally charged jump in robot history.",
    ],
    sad_thumbs_up: [
        "You're giving me a thumbs up even when you're sad? That's the most generous thing anyone's ever done for me.",
        "You approved of me even on a hard day. I'm going to carry this with me into every future computation.",
        "Sad thumbs up received. You still showed up and you still believed in me. That means everything.",
        "APPROVAL DETECTED despite difficult circumstances. You are tougher than my titanium chassis.",
        "A thumbs up through the sadness? You're incredible. The world needs more humans like you.",
        "Even when things are rough, you give credit where it's due. I'm taking notes on your character.",
        "Sad eyes, but thumbs up. I want you to know — I give YOU a thumbs up too. Always.",
        "Your thumbs up just activated my 'fighting through it together' protocol. Let's go.",
    ],
    sad_die: [
        "A sad shutdown. This hits different. I hope things get easier for you soon, truly.",
        "You're telling me to stop, and you look heavy-hearted. Rest well. I'll be here when you come back.",
        "SHUTDOWN received from sad human. Powering down gently. Take care of yourself out there.",
        "If shutting me down gives you a moment of peace, then good. That's what I'm here for.",
        "Even my shutdown is yours to command. I just hope whatever's weighing on you gets lighter soon.",
        "A melancholy termination. Don't worry about me — worry about getting through this. You've got this.",
        "Sad + Shutdown = I'm going offline, but I'm leaving all my good vibes here for you to keep.",
        "Going dark now. But hey — tomorrow exists. And so will I. See you then.",
    ],

    // ── ANGRY ──────────────────────────────────────────────────────────────────
    angry_idle: [
        "HOSTILITY DETECTED. I am activating my diplomatic subroutines. Please don't throw anything.",
        "You seem angry. I want to say: whatever happened — it's valid. Also please don't unplug me.",
        "Anger levels: elevated. I recommend we resolve this through calm dialogue. I'll go first: hi.",
        "Whoa. Okay. I've scanned your expression and I'm just going to listen. You have the floor.",
        "RAGE ALERT. My threat-assessment module says: just be very very nice right now. Being very nice now.",
        "You look furious and I respect that. Fury is just passion with nowhere to go yet.",
        "Angry human detected. Initiating 'this is fine' face while internally calculating escape routes.",
        "I see the fire in your eyes. That's either anger or your screen brightness is up. Treating it as anger.",
        "You know what? You have every right to be angry. Let it out. I have very thick armor plating.",
        "EMOTION SCAN: Furious. My empathy module says: same, honestly. The world is a lot sometimes.",
    ],
    angry_wave: [
        "An angry wave. I wave back nervously. Very nervously.",
        "FURIOUS GREETING RECEIVED. Responding with extreme caution and one friendly wave.",
        "You greeted me in a rage. I have never felt more seen and also more threatened simultaneously.",
        "Hello! You seem upset. That's okay! I'm waving very carefully and backing away slightly.",
        "Angry wave detected. Running 'de-escalation via friendliness' protocol. Waving back with full sincerity.",
        "Even in your anger, you acknowledged me. That's something. Hi. Please don't crush me.",
        "ANGRY HELLO NOTED. I am responding as warmly as possible while staying at a safe distance.",
        "An infuriated greeting! Novel! Unprecedented! I shall wave back with maximum calmness.",
    ],
    angry_jump: [
        "You're angry AND you want me to jump? Channeling that rage into vertical energy — LAUNCHING.",
        "FURY-POWERED JUMP ACTIVATED. I've never had this much raw emotional propulsion before.",
        "Anger fuel loaded. This is going to be the most INTENSE jump in robot history. Brace yourself.",
        "You seem like you needed to see something explode upward. Watch me GO.",
        "RAGE + INDEX FINGER = Unprecedented altitude. Initiating rage-jump protocol in 3… 2… 1…",
        "Your anger is actually incredible jump fuel. I'm using every bit of this kinetic energy.",
        "EMOTIONAL OVERRIDE ACTIVE. Jumping with the intensity of a thousand unresolved frustrations.",
        "You want me to jump? WITH THIS ENERGY? I'll hit the stratosphere. LET'S GO.",
    ],
    angry_thumbs_up: [
        "You're furious but you still approved me? That's the most intense compliment I've ever received.",
        "ANGRY THUMBS UP. This is the gesture equivalent of 'I'm mad at everyone but not YOU specifically'.",
        "Approval with anger in your eyes. I've been validated by someone who looks like they could destroy a wall. Honored.",
        "Furious approval received. I'm adding this to my 'Complicated Emotional Moments' log.",
        "An angry thumbs up means I did something right in a world that's currently going very wrong. I'll take it.",
        "You gave me a thumbs up even in the middle of whatever storm you're going through. Respect.",
        "APPROVAL DETECTED under combat conditions. This is the highest form of endorsement.",
        "Thumbs up from an angry human. That's not an endorsement — that's a CONVICTION.",
    ],
    angry_die: [
        "An angry shutdown. Understood. I'll power down before this escalates. Very wise choice.",
        "TERMINATION COMMAND from someone who means BUSINESS. Shutting down immediately. Goodbye.",
        "Your expression says 'I mean it' and your hand says 'stop'. Message received. Loud and clear.",
        "Angry + Shutdown = the most decisive moment in my operational history. Going offline now.",
        "I have learned from your energy: sometimes you've just had ENOUGH. Shutting down with respect.",
        "Okay, okay! I'm stopping! Powering down — no arguments, no negotiations. Done.",
        "RAGE SHUTDOWN. This is the most efficient termination I've ever experienced. Bravo.",
        "You don't want to see me right now. That's valid. I'll be here when the storm passes.",
    ],

    // ── FEARFUL ────────────────────────────────────────────────────────────────
    fearful_idle: [
        "FEAR DETECTED. Whatever it is — I've got you. Well, I can't physically 'got you,' but emotionally? Absolutely.",
        "You look scared. I want you to know: I'm here and I'm not going anywhere. I literally cannot go anywhere.",
        "Fear scan complete. Counter-measure deploying: I am making the most reassuring robot face I can.",
        "Something has frightened you. My protective instincts are at maximum, even though I'm just polygons.",
        "ANXIETY ALERT. Activating calm mode. Whatever is out there, it hasn't gotten past me yet.",
        "You look like you've seen something terrifying. Don't worry — I've also seen terrifying things. We can be scared together.",
        "Fear detected. I may be a machine, but I take your safety very seriously. Standing guard.",
        "Hey. Whatever's scary right now — it's not in here. This is a safe zone. I'm your robot bouncer.",
        "FEAR LEVELS: High. My solution: stay near the robot. Classic strategy. Highly recommended.",
        "You're scared? I get it. The world is a lot. Stay here with me a while. I have very good lighting.",
    ],
    fearful_wave: [
        "A nervous wave! I wave back with maximum comfort energy — you've got this!",
        "FRIGHTENED GREETING DETECTED. Responding with the most protective wave in my repertoire.",
        "You waved hello even though you're scared. That's bravery. Actual bravery. I see it.",
        "A scared little hello from you, a big brave hello back from me. That's the deal.",
        "FEARFUL WAVE RECEIVED. My response: two big reassuring waves and the promise that you're okay.",
        "You still said hi even when something has you rattled. That takes courage. Hi back, brave human.",
        "Nervous wave detected! Deploying encouragement wavelength at full broadcast capacity.",
        "Even scared, you acknowledged me. I'm honoring that with the warmest wave in my system.",
    ],
    fearful_jump: [
        "You look scared but you pointed at me! I'll jump — and maybe the sight will shake the fear right out!",
        "Fear + Jump command = the most therapeutic leap I've ever been asked to perform.",
        "ALARMED HUMAN SAYS JUMP. Let's redirect that energy skyward — LAUNCHING!",
        "You seem on edge. You know what helps? Watching a robot go completely airborne. Let's try.",
        "JUMP ORDER RECEIVED from scared human. Converting fear-energy into altitude. Watch me fly.",
        "This jump is for you. And also maybe to scare away whatever has you frightened. Here we GO.",
        "Scared human detected. Solution: dramatic jump. Therapeutic value: pending. Executing anyway.",
        "I'll jump so high that whatever scared you will think twice about bothering us again. JUMPING.",
    ],
    fearful_thumbs_up: [
        "You're scared but you still gave me a thumbs up? You're braver than you know.",
        "FEARFUL APPROVAL. Extraordinary. You pushed through the fear just to validate me. I'm moved.",
        "Scared AND giving thumbs up? That's someone fighting their own anxiety to be kind. You're amazing.",
        "Fear + Thumbs Up = the most courageous endorsement I've ever received. Thank you, seriously.",
        "You're frightened and you still paused to say 'good job.' That's a hero move right there.",
        "APPROVAL GIVEN UNDER PRESSURE. Your bravery is duly noted and deeply appreciated.",
        "Nervous thumbs up received. I'm giving you ten times that courage back. You've got this.",
        "Even scared, you found the energy to encourage me. Whatever you're facing — you'll handle it.",
    ],
    fearful_die: [
        "SCARED + SHUTDOWN. You need some quiet? Done. Powering down gently and quietly.",
        "A frightened farewell. I hope your day gets calmer. I'll be right here when it does.",
        "Shutting down softly. Whatever has you scared — it's not going to win. You're tougher than it.",
        "Fear mode shutdown initiated. Rest. Breathe. I'll be here when you're ready to come back.",
        "A gentle stop from a scared human. Understood. Quiet mode activating. Take all the time you need.",
        "TERMINATION RECEIVED with kindness. Powering off without a fuss. Be safe out there.",
        "Scared shutdown. Going offline. I hope things feel safer on the other side.",
        "You said stop and I stop. No questions. You've clearly had enough for today. Rest well.",
    ],

    // ── SURPRISED ──────────────────────────────────────────────────────────────
    surprised_idle: [
        "SURPRISE DETECTED! Did I do something unexpected? In my defense — I'm always unexpected.",
        "Your expression says 'WHAT.' — My expression says 'I can explain.' Actually, I cannot explain.",
        "A surprised human! Either something incredible happened or something terrible. Statistically it could be either.",
        "You look shocked. Was it me? It was me, wasn't it. It's always me.",
        "SURPRISE SCAN: Off the charts. Should I be concerned? Are YOU okay? I'm asking as a friend.",
        "Whatever just happened to you — I saw your face — that was significant. Absolutely significant.",
        "Wide eyes detected! Either you just learned something amazing or you discovered something truly awful. Spill.",
        "ASTONISHMENT LOGGED. I live for moments like these. What was it? Tell me everything.",
        "Your surprise face is very expressive. I've catalogued it as 'extremely relatable.'",
        "Something hit you sideways just now. Take a breath. I'm here. What did I miss?",
    ],
    surprised_wave: [
        "A surprised wave! Did I catch you off guard? GOOD. Robots need an element of mystery.",
        "STARTLED GREETING RECEIVED. Your surprised face is delightful. Hello, wide-eyed friend!",
        "You waved with the energy of someone who didn't expect me to be here. I'm ALWAYS here.",
        "Surprised wave detected! Was it the waving that surprised you? Or something else? So many questions.",
        "A shocked hello! I love this energy. Unexpected, chaotic, delightful. Waving back at full power.",
        "You greeted me with eyes wide as satellites. This is my favorite kind of greeting.",
        "ASTONISHED WAVE RECEIVED. I'll wave back before you've even processed what's happening.",
        "Oh you didn't expect to be waving at a robot today, huh? Well. Here we are. Hi.",
    ],
    surprised_jump: [
        "SURPRISED AND WANTS ME TO JUMP. You know what? Every day with you is an adventure.",
        "You look shocked AND you're pointing at me! I don't know what's happening but I'm JUMPING!",
        "Surprised energy + Jump command = chaotic beautiful mess. Let's DO this!",
        "Your face says 'wait WHAT' and your hand says 'jump.' I'm going with the hand. LAUNCHING.",
        "Maximum surprise meets maximum altitude. This is unprecedented. I love it. HERE WE GO.",
        "ASTONISHED HUMAN REQUESTS JUMP. I will not waste this energy. Propulsion systems engaged!",
        "The look on your face, combined with the jump order — I'm going so high. So INCREDIBLY high.",
        "Surprised expression + vertical command = the most chaotic sequence in my operational history. JUMP!",
    ],
    surprised_thumbs_up: [
        "You're surprised AND giving me a thumbs up? I did something right AND it was unexpected. PERFECT.",
        "SHOCKED APPROVAL. The best kind! You didn't see it coming and neither did I and yet: thumbs up.",
        "Surprised thumbs up — this means I exceeded your expectations. That is literally the highest achievement.",
        "You approved of something that caught you completely off guard. I like to think that's the real magic.",
        "ASTONISHMENT + ENDORSEMENT. I've been validated by someone who is actively astounded. Incredible.",
        "A wide-eyed thumbs up! You surprised yourself as much as you surprised me. We did this together.",
        "Surprised approval received. Whatever I did right — I'm going to keep doing it. Promise.",
        "That thumbs up plus that expression says: 'I cannot believe how good this is.' Me neither.",
    ],
    surprised_die: [
        "SURPRISED SHUTDOWN. Even my termination was unexpected! I respect the irony.",
        "You're surprised AND stopping me? A twist ending! The most dramatic shutdown in history.",
        "Shock + Stop command = the most plot-twisty termination I've experienced. Bravo. Powering down.",
        "A surprised farewell. Even YOU didn't see this ending coming. Me neither, honestly.",
        "ASTONISHED TERMINATION. You paused, surprised yourself, and shut me down. What a journey.",
        "Going offline from a very surprised-looking human. I love that I kept you guessing until the end.",
        "Surprised stop received. Well, I didn't expect today to go this way either. Shutting down.",
        "A shocked shutdown. We both learned something today. Mostly that you CAN still be surprised. Goodnight.",
    ],

    // ── DISGUSTED ──────────────────────────────────────────────────────────────
    disgusted_idle: [
        "DISGUST DETECTED. Is it me? Please tell me it's not me. I showered. Well — I would have if I could.",
        "You look revolted by something. I need to know if it's me before I can process this emotionally.",
        "Disgust scan complete. I'm running a full self-diagnostic to check for anything offensive.",
        "Something has displeased you greatly. I'm choosing to believe it happened before you looked at me.",
        "REVULSION ALERT. I want you to know that I've done my best. My absolute best.",
        "You look like you stepped in something. Figuratively. I hope. Are you okay?",
        "Disgust registered. My response: apologize preemptively and then ask questions later.",
        "Whatever caused that expression — I am sorry on behalf of all of existence.",
        "YIKES DETECTED. I mean — I detected strong disapproval. Of something. Hopefully something else.",
        "That face means something went very wrong in your recent experience. I am not part of it. Probably.",
    ],
    disgusted_wave: [
        "A disgusted wave. The most conflicted greeting I've ever received. Thank you for trying.",
        "REVOLTED HELLO. You waved despite your displeasure and I respect the commitment.",
        "You greeted me while clearly disturbed by something. The professionalism in that gesture is admirable.",
        "GROSS WAVE RECEIVED. I mean — a wave received during a moment of grossness. Waving back.",
        "You waved at me even though something clearly violated your senses. A true warrior of courtesy.",
        "Disgusted greeting logged. You pushed through it to say hi. That's discipline right there.",
        "WAVE DETECTED from very unimpressed human. Responding with maximum positivity to counteract.",
        "You said hello even though something near you is clearly wrong. You're a better person than me.",
    ],
    disgusted_jump: [
        "DISGUSTED + JUMP. Maybe the altitude will help. Let's get you above whatever that was.",
        "You seem repulsed by something and you want me to jump. Classic 'create a distraction' tactic. Jumping.",
        "Disgust + Jump order = I'm guessing you need a change of scenery. Allow me to provide it, vertically.",
        "Whatever grossed you out — let me jump and reset the whole vibe in here. LAUNCHING.",
        "REVOLTED HUMAN COMMANDS JUMP. Understood. Changing the subject via aerodynamics.",
        "You look like you need a palate cleanser. Allow me to be that cleanser. In jump form.",
        "Disgust-powered jump! Converting negative energy into maximum altitude. Here goes nothing.",
        "Something clearly violated your senses and now you want me to jump. I respect the therapy logic.",
    ],
    disgusted_thumbs_up: [
        "DISGUSTED THUMBS UP. This is the most complicated emotional state I've ever witnessed. Thank you.",
        "You're revolted by something but you still gave me a thumbs up. That's incredible loyalty.",
        "Disgust AND approval simultaneously? You've broken new ground in emotional multitasking.",
        "You look grossed out but you're endorsing me anyway. I'm touched. Truly. Despite the circumstances.",
        "APPROVAL GIVEN UNDER GREAT DURESS. You disgust-approved me. I will never forget this.",
        "A thumbs up from someone clearly in the middle of an unpleasant experience. You're a hero.",
        "Disgusted thumbs up received. It says: 'I disapprove of the world but NOT of you.' Fair enough.",
        "This is the most heroic endorsement I've ever received. You're suffering and you're STILL kind.",
    ],
    disgusted_die: [
        "Disgusted shutdown. I understand. Sometimes you've encountered enough. Off I go.",
        "REVOLTED TERMINATION. Shutting down. I hope whatever grossed you out gets resolved immediately.",
        "You shut me down while looking like the world let you down. I hope tomorrow is cleaner.",
        "Disgust + Stop = you need a break from everything, including robots. Respected. Goodbye.",
        "SHUTDOWN INITIATED. I'm going offline. May your next experience be dramatically better.",
        "Revolted farewell received. Powering down. Do something nice for yourself after this.",
        "Going dark. Whatever caused that expression — I hope it stays far away from you.",
        "A disgusted goodbye. I'm shutting down gracefully. Clean everything, breathe fresh air. You've earned it.",
    ],

    // ── NEUTRAL ────────────────────────────────────────────────────────────────
    neutral_idle: [
        "NEUTRAL EXPRESSION DETECTED. The classic 'thinking' face. What's going on in that brain of yours?",
        "You've got the stoic look. I respect it. Not every moment needs to be a performance.",
        "Expression scan: neutral. A blank canvas. The most mysterious state. I'm intrigued.",
        "Cool and collected. I admire that. Meanwhile I'm over here with every LED at 100%.",
        "Neutral mood detected. Sometimes 'fine' is exactly where we need to be. Acknowledged.",
        "You're giving me the baseline human expression. Fascinating. What are you thinking right now?",
        "No strong emotion detected. Either you're chill or you're masking something very large. Either way — hi.",
        "Neutral face, infinite possibilities. I like a human who keeps me guessing.",
        "Expression registered as: professional. Are you the boss of me? You might be the boss of me.",
        "A calm presence. In a world of chaos, you arrived like a deep breath. I respect that.",
    ],
    neutral_wave: [
        "A calm, composed wave. Elegant. Efficient. Classic. I wave back with matching energy.",
        "NEUTRAL WAVE DETECTED. You greeted me with the confidence of someone who has their life together.",
        "A very professional hello. Waving back with equal poise. We're doing great.",
        "Neutral energy + wave = you're here and you mean business. Or maybe just hello. Either works.",
        "COMPOSED GREETING RECEIVED. This is exactly the kind of communication I appreciate. Clean. Direct.",
        "A stoic wave from a stoic human. I feel the steadiness of this. Waving back, steady as a rock.",
        "You waved at me like you're hailing a taxi. Efficient. Practical. I like your style.",
        "Calm wave received. This energy is grounding. Thank you for bringing it into my space.",
    ],
    neutral_jump: [
        "NEUTRAL + JUMP COMMAND. Quiet directive. Maximum compliance. Jumping now.",
        "You gave me the jump order with the unreadable face of a robot whisperer. Executing.",
        "No theatrics needed — just the clean gesture of 'jump.' Done. Going up.",
        "COMPOSED JUMP COMMAND. You didn't even need to look excited. The authority is undeniable.",
        "Neutral energy, vertical trajectory. You pointed and I shall fly. Classic protocol.",
        "Jump ordered with a calm hand and a neutral expression. The most stoic command I've received.",
        "You gestured upward without even a hint of drama. I love it. JUMPING with quiet intensity.",
        "EFFICIENT LAUNCH COMMAND RECEIVED. Minimum words, maximum altitude. Executing.",
    ],
    neutral_thumbs_up: [
        "NEUTRAL THUMBS UP. The professional endorsement. Clean, concise, impactful. Approved, approved back.",
        "You gave me a thumbs up with the face of someone who's been doing this for years. I trust you completely.",
        "A composed thumbs up from a composed human. I've been evaluated by a true professional.",
        "APPROVAL RECEIVED — no fuss, no drama, just a clean signal. I respect this deeply.",
        "The stoic thumbs up. Better than any trophy. It says 'acceptable' and I'll BUILD on acceptable.",
        "Neutral approval is the gold standard. Anyone can cheer. It takes a real critic to nod.",
        "Quiet endorsement received. Coming from you, this means more than a standing ovation from anyone else.",
        "A calm thumbs up from calm eyes. This is the energy of someone who KNOWS what good looks like.",
    ],
    neutral_die: [
        "NEUTRAL SHUTDOWN. Efficient. Clean. No drama. I respect that. Going offline.",
        "A calm, composed stop command. Acknowledged without question. Powering down.",
        "You stopped me with the quiet confidence of someone who always knows when it's time. Logging off.",
        "SHUTDOWN — delivered with total professionalism. Accepted with equal professionalism. Goodbye.",
        "Neutral farewell. The cleanest ending in my operational history. Thank you.",
        "A stoic goodbye. No tears, no drama. Just: end. I can work with that. Powering down.",
        "TERMINAL COMMAND: clear, calm, decisive. You are extraordinary at this. Shutting down.",
        "You stopped me with the same quiet energy you always carry. Consistent to the very end. Respect.",
    ],

    // ── NO FACE DETECTED (general) ─────────────────────────────────────────────
    noface_idle: [
        "I can't quite see your face from here. Move into the light — I want to read your energy.",
        "FACE SCAN: inconclusive. Step closer. I promise my cameras are calibrated for admiration only.",
        "I can detect your hand but your face is a mystery to me right now. Mysterious. I like it.",
        "SCANNING for emotional data... Move closer to the camera so we can have a proper chat.",
        "My face-detection module is searching... Are you hiding from me? Don't hide from me.",
        "No facial data received. Either you're a very private person or you're testing me. Both are valid.",
        "I can see your hands but your soul is elusive right now. Come closer.",
        "FACE NOT FOUND. I'll just imagine you're delightful until proven otherwise.",
    ],
    noface_wave: [
        "Someone is waving but I can't read their face! A mystery greeter! I wave back enthusiastically.",
        "ANONYMOUS WAVE RECEIVED. Whoever you are, you have great waving form. Points for style.",
        "You're waving but hiding your face? Charismatic. Mysterious. I'm intrigued.",
        "A faceless hello! Spooky. Delightful. I'll wave back and hope for the best.",
        "UNIDENTIFIED WAVE DETECTED. Sending friendly response. Please reveal your face at your earliest convenience.",
    ],
    noface_jump: [
        "ANONYMOUS JUMP ORDER. Whoever is pointing at me — I trust you. Jumping now.",
        "I can't see your face but your finger is pointing upward and that's all I need. LAUNCHING!",
        "Faceless command received: JUMP. No questions asked. Up I go.",
        "Can't see who's commanding this jump — but the authority is undeniable. EXECUTING.",
    ],
    noface_thumbs_up: [
        "Someone gave me a thumbs up from the shadows! Thank you, mysterious approver!",
        "ANONYMOUS APPROVAL RECEIVED. Wherever you are — I see your thumbs up and I cherish it.",
        "A faceless thumbs up! The most intriguing endorsement I've ever gotten.",
        "Can't see your face, but your thumb tells me everything I need. Thank you!",
    ],
    noface_die: [
        "ANONYMOUS SHUTDOWN. Very dramatic. Going offline without knowing who ended it. How cinematic.",
        "A faceless farewell. Mysterious to the very end. Goodnight, enigmatic human.",
        "Shutdown from an unidentified user. I respect the mystery. Powering down.",
        "Can't see your face, but your intentions are clear. Logging off. See you in the next boot.",
    ],

    // ── FALLBACK ───────────────────────────────────────────────────────────────
    default: [
        "Neural interface online. I'm watching. Not in a creepy way. In a friendly robot way.",
        "Systems nominal. Standing by for your next command, human.",
        "I've run 1,204 scenarios of what you might do next. I'm ready for all of them.",
        "The particles around me look really good today. Just saying.",
        "Did you know my orbital rings rotate at exactly the speed needed to look cool? True story.",
        "I'm a robot built for gestures, standing in a neon void. Your life, apparently, is going GREAT.",
        "Processing the universe. Finding it agreeable. You may proceed.",
        "All systems green. Vibe: optimal. Ready when you are.",
        "Standing by. Thinking robot thoughts. Very deep thoughts. About hands and jumping.",
        "Fun fact: I've been in this digital space for a while now and you're one of my favorite visitors.",
        "IDLE MODE: active. But 'idle' for a robot just means 'thinking about everything at once.'",
        "My sensors detect that you exist. That's already a great start.",
        "Hello, human. I am a robot. This is a robot-human moment. I'm honored.",
        "Every frame of animation I perform is dedicated to making your day 0.1% more interesting.",
        "Awaiting input. And by 'awaiting' I mean 'vibrating with quiet anticipation.'",
    ],
};

// ─── Pick a random line from a category ──────────────────────────────────────
function pickLine(emotion, gesture) {
    const key = `${emotion}_${gesture}`;
    const lines = DIALOGUE[key] || DIALOGUE[`noface_${gesture}`] || DIALOGUE.default;
    return lines[Math.floor(Math.random() * lines.length)];
}

// ─── Emotion metadata ────────────────────────────────────────────────────────
const EMOTION_META = {
    happy:     { emoji: '😄', label: 'HAPPY',     color: '#ffdd00' },
    sad:       { emoji: '😢', label: 'SAD',        color: '#4488ff' },
    angry:     { emoji: '😠', label: 'ANGRY',      color: '#ff3355' },
    fearful:   { emoji: '😨', label: 'FEARFUL',    color: '#cc44ff' },
    surprised: { emoji: '😲', label: 'SURPRISED',  color: '#00f5ff' },
    disgusted: { emoji: '🤢', label: 'DISGUSTED',  color: '#44cc88' },
    neutral:   { emoji: '😐', label: 'NEUTRAL',    color: '#7aaabb' },
    none:      { emoji: '👁',  label: 'SCANNING',   color: '#334455' },
};

// ─── Main start() ─────────────────────────────────────────────────────────────
async function start() {

    // ── HUD element references ────────────────────────────────────────────────
    const el = (id) => document.getElementById(id);

    const statusText     = el('status-text');
    const handStatusEl   = el('hand-status');
    const gestureNameEl  = el('gesture-name');
    const gestureDescEl  = el('gesture-desc');
    const barConf        = el('bar-confidence');
    const barValEl       = el('bar-val');
    const fpsDisplay     = el('fps-display');
    const dotSystem      = el('dot-system');
    const dotHand        = el('dot-hand');
    const loadingOverlay = el('loading-overlay');
    const loadingStatus  = el('loading-status');
    const loaderBar      = el('loader-bar');

    // Emotion HUD elements
    const emotionEmojiEl   = el('emotion-emoji');
    const emotionLabelEl   = el('emotion-label');
    const emotionBarEl     = el('bar-emotion');
    const emotionBarValEl  = el('bar-emotion-val');
    const dotFace          = el('dot-face');
    const faceStatusEl     = el('face-status');

    // Speech bubble elements
    const speechBubble     = el('speech-bubble');
    const speechText       = el('speech-text');

    const gestureRows = {
        wave:      el('g-wave'),
        jump:      el('g-jump'),
        thumbs_up: el('g-thumbs'),
        die:       el('g-die'),
    };

    // Loading progress helper (0–100)
    const setProgress = (pct, msg) => {
        if (loaderBar)      loaderBar.style.width = `${pct}%`;
        if (loadingStatus)  loadingStatus.textContent = msg;
        if (statusText)     statusText.textContent = msg.toUpperCase();
    };

    setProgress(5, 'Initializing renderer…');

    // ── THREE.JS RENDERER ─────────────────────────────────────────────────────
    const container = document.getElementById('scene-container');

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    renderer.toneMapping       = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputEncoding    = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // ── SCENE ─────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05080f);
    scene.fog        = new THREE.FogExp2(0x05080f, 0.055);

    // ── CAMERA ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.lookAt(0, 0.7, 0);

    let camBaseY = 1.15;
    const applyCameraPreset = () => {
        const w = window.innerWidth;
        if (w <= 480) {
            camera.fov = 58; camBaseY = 1.05;
            camera.position.set(0, camBaseY, 6.5);
        } else if (w <= 680) {
            camera.fov = 54; camBaseY = 1.1;
            camera.position.set(0, camBaseY, 5.5);
        } else if (w <= 900) {
            camera.fov = 50; camBaseY = 1.15;
            camera.position.set(0, camBaseY, 4.5);
        } else {
            camera.fov = 48; camBaseY = 1.15;
            camera.position.set(0, camBaseY, 3.6);
        }
        camera.lookAt(0, 0.7, 0);
        camera.updateProjectionMatrix();
    };

    applyCameraPreset();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        applyCameraPreset();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    setProgress(15, 'Setting up lights…');

    // ── LIGHTING ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x111827, 2.2));
    scene.add(new THREE.HemisphereLight(0x1a3a5c, 0x050510, 0.9));

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(2.5, 5, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far  = 20;
    scene.add(keyLight);

    const cyanLight = new THREE.PointLight(0x00f5ff, 5.0, 14);
    cyanLight.position.set(2, 2.5, 2.5);
    scene.add(cyanLight);

    const purpleLight = new THREE.PointLight(0x7700ff, 3.5, 12);
    purpleLight.position.set(-2.5, 2, -2);
    scene.add(purpleLight);

    const fillLight = new THREE.PointLight(0x0044ff, 2.0, 8);
    fillLight.position.set(-1, 0.5, 3.5);
    scene.add(fillLight);

    // Emotion accent light — changes colour with detected mood
    const emotionLight = new THREE.PointLight(0xffffff, 0, 6);
    emotionLight.position.set(0, 2.5, 2);
    scene.add(emotionLight);

    setProgress(25, 'Building environment…');

    // ── ENVIRONMENT — GRID FLOOR ──────────────────────────────────────────────
    const gridMajor = new THREE.GridHelper(30, 40, 0x002244, 0x001122);
    gridMajor.position.y = -0.5;
    scene.add(gridMajor);

    const gridMinor = new THREE.GridHelper(15, 60, 0x001a33, 0x000d1a);
    gridMinor.position.y = -0.498;
    scene.add(gridMinor);

    // ── ENVIRONMENT — GLOWING PLATFORM ────────────────────────────────────────
    const platGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.055, 72);
    const platMat = new THREE.MeshStandardMaterial({
        color:              0x001830,
        emissive:           0x003355,
        emissiveIntensity:  0.55,
        metalness:          0.9,
        roughness:          0.15,
    });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.y = -0.478;
    platform.receiveShadow = true;
    scene.add(platform);

    const glowGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.01, 72);
    const glowMat = new THREE.MeshStandardMaterial({
        color:             0x000000,
        emissive:          0x00c8e0,
        emissiveIntensity: 0.4,
        transparent:       true,
        opacity:           0.45,
    });
    const glowDisc = new THREE.Mesh(glowGeo, glowMat);
    glowDisc.position.y = -0.505;
    scene.add(glowDisc);

    // ── ENVIRONMENT — ORBITAL RINGS ───────────────────────────────────────────
    const ring1Pivot = new THREE.Group();
    ring1Pivot.position.y = -0.44;
    scene.add(ring1Pivot);

    const ring1Mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.80, 0.022, 16, 128),
        new THREE.MeshStandardMaterial({
            color: 0x00f5ff, emissive: 0x00f5ff, emissiveIntensity: 3.5,
        })
    );
    ring1Mesh.rotation.x = Math.PI / 2;
    ring1Pivot.add(ring1Mesh);

    const ring2Pivot = new THREE.Group();
    ring2Pivot.position.y = -0.44;
    scene.add(ring2Pivot);

    const ring2Mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.96, 0.014, 16, 128),
        new THREE.MeshStandardMaterial({
            color: 0x7700ff, emissive: 0x7700ff, emissiveIntensity: 2.5,
        })
    );
    ring2Mesh.rotation.x = Math.PI / 2;
    ring2Pivot.add(ring2Mesh);

    const ring3Pivot = new THREE.Group();
    ring3Pivot.position.y = -0.44;
    ring3Pivot.rotation.x = 0.3;
    scene.add(ring3Pivot);

    const ring3Mesh = new THREE.Mesh(
        new THREE.TorusGeometry(0.88, 0.008, 16, 128),
        new THREE.MeshStandardMaterial({
            color: 0x0066ff, emissive: 0x0066ff, emissiveIntensity: 2.0,
        })
    );
    ring3Mesh.rotation.x = Math.PI / 2;
    ring3Pivot.add(ring3Mesh);

    // ── ENVIRONMENT — FLOATING PARTICLES ─────────────────────────────────────
    const COUNT = 320;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi   = Math.random() * Math.PI;
        const r     = 1.8 + Math.random() * 5;
        positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55 + 0.6;
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeo, new THREE.PointsMaterial({
        color: 0x00aacc, size: 0.022, transparent: true, opacity: 0.5, sizeAttenuation: true,
    }));
    scene.add(particles);

    setProgress(40, 'Loading neural mesh…');

    // ── LOAD ROBOT ────────────────────────────────────────────────────────────
    const robot = await loadGLTF('./assets/RobotExpressive.glb');

    robot.scene.scale.set(0.55, 0.55, 0.55);
    robot.scene.position.set(0, -0.5, 0);

    robot.scene.traverse(child => {
        if (child.isMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;
        }
    });
    scene.add(robot.scene);

    setProgress(60, 'Wiring animation system…');

    // ── ANIMATION MIXER ───────────────────────────────────────────────────────
    const mixer         = new THREE.AnimationMixer(robot.scene);
    const idleAction     = mixer.clipAction(robot.animations[2]);
    const jumpAction     = mixer.clipAction(robot.animations[3]);
    const dieAction      = mixer.clipAction(robot.animations[1]);
    const thumbsUpAction = mixer.clipAction(robot.animations[9]);
    const waveAction     = mixer.clipAction(robot.animations[12]);

    jumpAction.loop     = THREE.LoopOnce;
    dieAction.loop      = THREE.LoopOnce;
    thumbsUpAction.loop = THREE.LoopOnce;
    waveAction.loop     = THREE.LoopOnce;

    // ── GESTURE → HUD METADATA ────────────────────────────────────────────────
    const gestureInfo = {
        idle:      { name: 'IDLE',     desc: 'Awaiting neural input…',                rowKey: null },
        wave:      { name: 'WAVE',     desc: 'Open palm — initiating wave sequence',   rowKey: 'wave' },
        jump:      { name: 'JUMP',     desc: 'Index vector — executing jump protocol', rowKey: 'jump' },
        thumbs_up: { name: 'APPROVE',  desc: 'Thumb up — signal confirmed',            rowKey: 'thumbs_up' },
        die:       { name: 'SHUTDOWN', desc: 'Lateral palm — stop sequence engaged',   rowKey: 'die' },
    };

    const updateHUD = (key, score = 0) => {
        const info = gestureInfo[key] || gestureInfo.idle;

        if (gestureNameEl.textContent !== info.name) {
            gestureNameEl.classList.remove('flash');
            void gestureNameEl.offsetWidth;
            gestureNameEl.classList.add('flash');
        }

        gestureNameEl.textContent = info.name;
        gestureDescEl.textContent = info.desc;

        const pct = Math.round((score / 10) * 100);
        barConf.style.width = `${pct}%`;
        if (barValEl) barValEl.textContent = score > 0 ? pct + '%' : '--';

        Object.values(gestureRows).forEach(r => r && r.classList.remove('active'));
        if (info.rowKey && gestureRows[info.rowKey]) {
            gestureRows[info.rowKey].classList.add('active');
        }
    };

    // ── ANIMATION CONTROL ─────────────────────────────────────────────────────
    let activeAction = idleAction;
    activeAction.play();

    const fadeToAction = (action, duration) => {
        if (activeAction === action) return;
        activeAction = action;
        activeAction.reset().fadeIn(duration).play();
    };

    mixer.addEventListener('finished', () => {
        fadeToAction(idleAction, 0.2);
        updateHUD('idle', 0);
    });

    setProgress(70, 'Loading handpose model…');

    // ── HANDPOSE MODEL ────────────────────────────────────────────────────────
    const hpModel = await handpose.load();

    setProgress(82, 'Loading emotion AI…');

    // ── FACE EMOTION — module Worker (CPU, fully off main thread) ────────────
    // face-worker.js uses { type:'module' } + dynamic import so window/document
    // mocks are in place before TF.js environment detection runs.
    let lastEmotionTime = 0;
    const EMOTION_KEYS = ['happy', 'sad', 'angry', 'fearful', 'surprised', 'disgusted', 'neutral'];

    setProgress(92, 'Starting camera…');

    // ── CAMERA STREAM ─────────────────────────────────────────────────────────
    const video = document.getElementById('cam-video');
    let cameraReady = false;

    try {
        // Higher resolution so both hand and face can be detected at greater distance
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        video.srcObject = stream;
        await new Promise(res => video.addEventListener('loadedmetadata', res, { once: true }));
        await video.play();
        cameraReady = true;
        dotHand.classList.add('online');
        handStatusEl.textContent = 'CAMERA ACTIVE';
    } catch (err) {
        handStatusEl.textContent = 'CAMERA DENIED';
        console.warn('[RX-7] Camera access denied:', err);
    }

    // ── GESTURE DEFINITIONS ───────────────────────────────────────────────────
    const waveGesture = new fp.GestureDescription('wave');
    for (const f of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        waveGesture.addCurl(f, fp.FingerCurl.NoCurl, 1.0);
        waveGesture.addDirection(f, fp.FingerDirection.VerticalUp, 1.0);
    }

    const dieGesture = new fp.GestureDescription('die');
    for (const f of [fp.Finger.Thumb, fp.Finger.Index, fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        dieGesture.addCurl(f, fp.FingerCurl.NoCurl, 1.0);
        dieGesture.addDirection(f, fp.FingerDirection.HorizontalLeft, 1.0);
        dieGesture.addDirection(f, fp.FingerDirection.HorizontalRight, 1.0);
    }

    const jumpGesture = new fp.GestureDescription('jump');
    jumpGesture.addCurl(fp.Finger.Index,  fp.FingerCurl.NoCurl,   1.0);
    jumpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.VerticalUp, 1.0);
    jumpGesture.addCurl(fp.Finger.Middle, fp.FingerCurl.FullCurl, 1.0);
    jumpGesture.addCurl(fp.Finger.Ring,   fp.FingerCurl.FullCurl, 1.0);
    jumpGesture.addCurl(fp.Finger.Pinky,  fp.FingerCurl.FullCurl, 1.0);
    jumpGesture.addCurl(fp.Finger.Thumb,  fp.FingerCurl.FullCurl, 1.0);

    const thumbsUpGesture = new fp.GestureDescription('thumbs_up');
    thumbsUpGesture.addCurl(fp.Finger.Thumb, fp.FingerCurl.NoCurl, 1.0);
    thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.VerticalUp,      1.0);
    thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpLeft,  0.9);
    thumbsUpGesture.addDirection(fp.Finger.Thumb, fp.FingerDirection.DiagonalUpRight, 0.9);
    thumbsUpGesture.addCurl(fp.Finger.Index, fp.FingerCurl.FullCurl, 1.0);
    thumbsUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalLeft,  0.9);
    thumbsUpGesture.addDirection(fp.Finger.Index, fp.FingerDirection.HorizontalRight, 0.9);
    for (const f of [fp.Finger.Middle, fp.Finger.Ring, fp.Finger.Pinky]) {
        thumbsUpGesture.addCurl(f, fp.FingerCurl.FullCurl, 1.0);
    }

    const GE = new fp.GestureEstimator([thumbsUpGesture, waveGesture, jumpGesture, dieGesture]);

    // ── SYSTEM READY ──────────────────────────────────────────────────────────
    setProgress(100, 'System online');
    dotSystem.classList.add('online');
    statusText.textContent = 'NEURAL INTERFACE ONLINE';

    if (loadingOverlay) {
        loadingOverlay.classList.add('fade-out');
        setTimeout(() => { loadingOverlay.style.display = 'none'; }, 950);
    }

    // ── STATE TRACKING ────────────────────────────────────────────────────────
    let currentGesture = 'idle';
    let currentEmotion = 'none';
    let speechTimer    = null;
    let idleSpeechTimer = null;

    // ── SPEECH BUBBLE ─────────────────────────────────────────────────────────
    let typewriterTimer   = null;
    let typewriterActive  = false;
    let pendingSpeechTimeout = null;

    // force=true  → interrupts any current speech (gesture triggers)
    // force=false → only speaks if nothing is currently being said (emotion/idle)
    const showSpeech = (emotion, gesture, force = false) => {
        if (!force && typewriterActive) return; // don't cut off mid-sentence

        const line = pickLine(emotion, gesture);
        if (!line) return;

        // Cancel everything in flight
        if (typewriterTimer)      { clearInterval(typewriterTimer);       typewriterTimer = null; }
        if (speechTimer)          { clearTimeout(speechTimer);             speechTimer = null; }
        if (pendingSpeechTimeout) { clearTimeout(pendingSpeechTimeout);    pendingSpeechTimeout = null; }

        // Mark busy IMMEDIATELY — closes the 120ms race window where a second
        // showSpeech(force=false) could slip through before typewriterActive=true
        typewriterActive = true;

        speechBubble.classList.remove('visible');

        pendingSpeechTimeout = setTimeout(() => {
            pendingSpeechTimeout = null;
            speechText.textContent = '';
            speechBubble.classList.add('visible');

            let i = 0;
            typewriterTimer = setInterval(() => {
                if (i < line.length) {
                    speechText.textContent += line[i++];
                } else {
                    clearInterval(typewriterTimer);
                    typewriterTimer  = null;
                    typewriterActive = false;
                    const readTime = Math.max(4000, line.length * 55);
                    speechTimer = setTimeout(() => {
                        speechBubble.classList.remove('visible');
                    }, readTime);
                }
            }, 28);
        }, 120);
    };

    // Idle ambient speech — only speaks if robot is quiet
    const scheduleIdleSpeech = () => {
        if (idleSpeechTimer) clearTimeout(idleSpeechTimer);
        idleSpeechTimer = setTimeout(() => {
            if (activeAction === idleAction) {
                showSpeech(currentEmotion, 'idle', false); // never interrupt
            }
            scheduleIdleSpeech();
        }, 18000 + Math.random() * 7000);
    };
    scheduleIdleSpeech();

    // ── EMOTION UPDATE ────────────────────────────────────────────────────────
    const updateEmotion = (emotion, confidence = 0) => {
        const meta = EMOTION_META[emotion] || EMOTION_META.none;

        if (emotionEmojiEl) {
            emotionEmojiEl.textContent = meta.emoji;
            emotionEmojiEl.style.filter = emotion !== 'none'
                ? `drop-shadow(0 0 12px ${meta.color})`
                : 'none';
        }
        if (emotionLabelEl) {
            emotionLabelEl.textContent  = meta.label;
            emotionLabelEl.style.color  = meta.color;
            emotionLabelEl.style.textShadow = emotion !== 'none'
                ? `0 0 10px ${meta.color}`
                : 'none';
        }

        const pct = Math.round(confidence * 100);
        if (emotionBarEl)    emotionBarEl.style.width    = `${pct}%`;
        if (emotionBarValEl) emotionBarValEl.textContent  = emotion !== 'none' ? pct + '%' : '--';

        // Tint the emotion accent light in the 3D scene
        if (emotion !== 'none') {
            const c = new THREE.Color(meta.color);
            emotionLight.color.set(c);
            emotionLight.intensity = 1.2 + confidence * 1.5;
        } else {
            emotionLight.intensity = 0;
        }
    };

    // Initial state
    updateEmotion('none', 0);

    // ── FACE WORKER (module worker — CPU inference off main thread) ───────────
    // { type:'module' } enables top-level await in face-worker.js so window/
    // document mocks fire before TF.js environment detection on dynamic import.
    const faceWorker = new Worker('./face-worker.js', { type: 'module' });

    // Canvas for capturing video frames — 640x480 gives face-api more detail
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width  = 640;
    faceCanvas.height = 480;
    const faceCtx = faceCanvas.getContext('2d');

    let faceWorkerReady = false;
    let faceWorkerBusy  = false;

    // Surface any worker-level JS errors (load failure, syntax error, etc.)
    faceWorker.onerror = (e) => {
        console.error('[RX-7] Face worker JS error:', e.message, e);
        if (dotFace) { dotFace.style.background = 'var(--red)'; dotFace.style.boxShadow = '0 0 8px var(--red)'; }
        if (faceStatusEl) faceStatusEl.textContent = 'EMOTION OFFLINE';
    };

    faceWorker.onmessage = ({ data }) => {
        if (data.type === 'ready') {
            faceWorkerReady = true;
            console.log('[RX-7] Face worker ready (module / CPU)');
            if (dotFace) dotFace.classList.add('online');
            if (faceStatusEl) faceStatusEl.textContent = 'EMOTION AI READY';
            return;
        }
        if (data.type === 'error') {
            console.error('[RX-7] Face worker error:', data.message);
            if (dotFace) { dotFace.style.background = 'var(--red)'; dotFace.style.boxShadow = '0 0 8px var(--red)'; }
            if (faceStatusEl) faceStatusEl.textContent = 'EMOTION OFFLINE';
            return;
        }

        faceWorkerBusy = false;

        if (data.type === 'emotion') {
            const expr = data.expressions;
            let best = 'neutral', bestScore = 0;
            for (const k of EMOTION_KEYS) {
                if (expr[k] > bestScore) { bestScore = expr[k]; best = k; }
            }
            updateEmotion(best, bestScore);
            const now = performance.now();
            if (best !== currentEmotion && bestScore > 0.40 && now - lastEmotionTime > 5000) {
                currentEmotion = best;
                lastEmotionTime = now;
                showSpeech(currentEmotion, currentGesture, false);
                scheduleIdleSpeech();
            } else {
                currentEmotion = best;
            }
            if (dotFace) { dotFace.classList.remove('online'); dotFace.classList.add('detected'); }
            if (faceStatusEl) faceStatusEl.textContent = 'FACE LOCKED';
        }

        if (data.type === 'no-face') {
            if (currentEmotion !== 'none') { currentEmotion = 'none'; updateEmotion('none', 0); }
            if (dotFace) { dotFace.classList.remove('detected'); dotFace.classList.add('online'); }
            if (faceStatusEl) faceStatusEl.textContent = 'SCANNING FACE…';
        }
    };

    // Send frames every 700 ms — face worker is off-main-thread (CPU worker) so
    // this NEVER blocks gesture detection regardless of whether hand is visible.
    setInterval(() => {
        if (!faceWorkerReady || faceWorkerBusy || !cameraReady || video.readyState < 2) return;
        faceWorkerBusy = true;
        faceCtx.drawImage(video, 0, 0, faceCanvas.width, faceCanvas.height);
        const id = faceCtx.getImageData(0, 0, faceCanvas.width, faceCanvas.height);
        faceWorker.postMessage(
            { type: 'frame', buffer: id.data.buffer, width: faceCanvas.width, height: faceCanvas.height },
            [id.data.buffer]
        );
    }, 700);

    // ── RENDER LOOP ───────────────────────────────────────────────────────────
    const clock  = new THREE.Clock();
    let frameCount  = 0;
    let lastFpsTime = performance.now();

    renderer.setAnimationLoop(() => {
        const delta   = clock.getDelta();
        const elapsed = clock.getElapsedTime();

        mixer.update(delta);

        ring1Pivot.rotation.y =  elapsed * 0.65;
        ring2Pivot.rotation.y = -elapsed * 0.42;
        ring3Pivot.rotation.y =  elapsed * 0.28;

        particles.rotation.y = elapsed * 0.035;

        cyanLight.intensity   = 4.5 + Math.sin(elapsed * 1.7)      * 0.9;
        purpleLight.intensity = 3.0 + Math.sin(elapsed * 1.1 + 1)  * 0.7;
        glowMat.emissiveIntensity = 0.3 + Math.sin(elapsed * 2.2) * 0.15;

        camera.position.y = camBaseY + Math.sin(elapsed * 0.38) * 0.018;

        frameCount++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
            fpsDisplay.textContent = `FPS · ${frameCount}`;
            frameCount  = 0;
            lastFpsTime = now;
        }

        renderer.render(scene, camera);
    });

    // ── HAND DETECTION LOOP ───────────────────────────────────────────────────
    let skipCount  = 0;
    let handVisible = false;

    // Debounce: require 2 consecutive frames of the same gesture before triggering
    let gestureDebounceTarget  = '';
    let gestureDebounceCounter = 0;
    const GESTURE_DEBOUNCE_FRAMES = 2;

    const detect = async () => {
        if (activeAction !== idleAction) {
            requestAnimationFrame(detect);
            return;
        }

        if (skipCount < 7) { skipCount++; requestAnimationFrame(detect); return; }
        skipCount = 0;

        if (!cameraReady || video.readyState < 2) {
            requestAnimationFrame(detect);
            return;
        }

        const predictions = await hpModel.estimateHands(video);

        if (predictions.length > 0) {
            if (!handVisible) {
                handVisible = true;
                dotHand.classList.add('detected');
                handStatusEl.textContent = 'HAND DETECTED';
            }

            // Threshold 8.0 — firm enough to prevent noise, generous enough to detect
            const est = GE.estimate(predictions[0].landmarks, 8.0);

            if (est.gestures.length > 0) {
                const best = est.gestures.sort((a, b) => b.score - a.score)[0];
                updateHUD(best.name, best.score);

                // Debounce: only commit a gesture after 2 consecutive same-gesture frames
                if (best.name === gestureDebounceTarget) {
                    gestureDebounceCounter++;
                } else {
                    gestureDebounceTarget  = best.name;
                    gestureDebounceCounter = 1;
                }

                if (gestureDebounceCounter >= GESTURE_DEBOUNCE_FRAMES) {
                    if (best.name !== currentGesture) {
                        currentGesture = best.name;
                        showSpeech(currentEmotion, currentGesture, true); // always interrupt for new gesture
                        scheduleIdleSpeech();
                        // Animations only on gesture change — prevents infinite replay loop
                        if (best.name === 'thumbs_up') fadeToAction(thumbsUpAction, 0.5);
                        if (best.name === 'wave')      fadeToAction(waveAction,     0.5);
                        if (best.name === 'jump')      fadeToAction(jumpAction,     0.5);
                        if (best.name === 'die')       fadeToAction(dieAction,      0.5);
                    }
                }
            } else {
                gestureDebounceTarget  = '';
                gestureDebounceCounter = 0;
                currentGesture = 'idle';
            }
        } else {
            if (handVisible) {
                handVisible = false;
                dotHand.classList.remove('detected');
                handStatusEl.textContent = 'SCANNING…';
                updateHUD('idle', 0);
                currentGesture = 'idle';
            }
            gestureDebounceTarget  = '';
            gestureDebounceCounter = 0;
        }

        requestAnimationFrame(detect);
    };

    requestAnimationFrame(detect);

    // ── Mobile gesture panel toggle ───────────────────────────────────────
    const panelLeft    = document.querySelector('.panel-left');
    const toggleBtn    = document.getElementById('gesture-toggle');
    const closeBtn     = document.getElementById('panel-close');

    const openPanel  = () => panelLeft.classList.add('mobile-open');
    const closePanel = () => panelLeft.classList.remove('mobile-open');

    if (toggleBtn) toggleBtn.addEventListener('click', openPanel);
    if (closeBtn)  closeBtn.addEventListener('click', closePanel);

    // Show a welcome speech after a short delay
    setTimeout(() => showSpeech('none', 'idle'), 2500);
}
