/* ============================================================
   KIDS FLIX — Curriculum, Courses, Games & Badges
   Created by Ntandomods
   Zimbabwe: ECD → Grade 7 → O-Level
   ============================================================ */

const LEVELS = [
  {
    id: "ecd",
    name: "ECD",
    fullName: "Early Childhood Development",
    ages: "Ages 3–5",
    emoji: "🧸",
    cls: "lv-ecd",
    tagline: "Play, sing and discover your first letters, numbers and colours.",
    subjects: [
      {
        id: "ecd-colours", name: "Colours & Shapes", emoji: "🎨", color: "#FF8A00",
        desc: "Learn the colours of the rainbow and shapes all around us.",
        lessons: [
          {
            title: "The Rainbow Colours", emoji: "🌈", kicker: "Colours",
            body: `<p>Colours make our world beautiful! In Zimbabwe we see colours everywhere — the <strong>green</strong> of the msasa trees, the <strong>yellow</strong> of the sun, and the <strong>red</strong> of the flame lily, our national flower.</p>
              <p>Let us learn the colours of the rainbow. We can remember them with a fun sentence: <strong>R</strong>ichard <strong>O</strong>f <strong>Y</strong>ork <strong>G</strong>ave <strong>B</strong>attle <strong>I</strong>n <strong>V</strong>ain.</p>
              <ul><li>Red</li><li>Orange</li><li>Yellow</li><li>Green</li><li>Blue</li><li>Indigo</li><li>Violet</li></ul>
              <p>When you mix two colours you can make a brand new colour. Mix <strong>red + yellow</strong> and you get <strong>orange</strong>. Mix <strong>blue + yellow</strong> and you get <strong>green</strong>!</p>`,
            keyFact: "The flame lily (Amacuba) is Zimbabwe's national flower and it is bright red and yellow.",
            quiz: [
              { q: "What colour do you get when you mix blue and yellow?", options: ["Green", "Purple", "Brown", "Pink"], answer: 0 },
              { q: "Which colour is the sun?", options: ["Yellow", "Blue", "Black", "Grey"], answer: 0 },
              { q: "What is Zimbabwe's national flower?", options: ["Flame lily", "Rose", "Sunflower", "Daisy"], answer: 0 }
            ]
          },
          {
            title: "Shapes Around Us", emoji: "🔺", kicker: "Shapes",
            body: `<p>Shapes are everywhere — in your home, your school and outside. Let us learn the basic shapes.</p>
              <ul><li><strong>Circle</strong> — round like a ball or the sun</li><li><strong>Square</strong> — 4 equal sides, like a window</li><li><strong>Triangle</strong> — 3 sides, like a roof</li><li><strong>Rectangle</strong> — like a door or a book</li><li><strong>Star</strong> — like the stars at night</li></ul>
              <p>Can you find a circle in your home? A clock is a circle. A plate is a circle. A wheel is a circle!</p>`,
            keyFact: "A square has 4 sides that are all the same length. A triangle has 3 sides.",
            quiz: [
              { q: "How many sides does a triangle have?", options: ["3", "4", "5", "6"], answer: 0 },
              { q: "Which shape is round like a ball?", options: ["Circle", "Square", "Triangle", "Star"], answer: 0 },
              { q: "A door is shaped like a…", options: ["Rectangle", "Circle", "Star", "Triangle"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "ecd-numbers", name: "Numbers 1–10", emoji: "🔢", color: "#2E9BFF",
        desc: "Count, trace and play with numbers from one to ten.",
        lessons: [
          {
            title: "Counting 1 to 10", emoji: "✋", kicker: "Numbers",
            body: `<p>Counting is fun! Let us count together using our fingers.</p>
              <p>1, 2, 3, 4, 5, 6, 7, 8, 9, 10!</p>
              <p>You can count many things in Zimbabwe: <strong>one</strong> elephant at Hwange, <strong>two</strong> sadza balls, <strong>three</strong> mbira notes, and so on.</p>
              <ul><li>1 — one</li><li>2 — two</li><li>3 — three</li><li>4 — four</li><li>5 — five</li><li>6 — six</li><li>7 — seven</li><li>8 — eight</li><li>9 — nine</li><li>10 — ten</li></ul>`,
            keyFact: "You have 10 fingers and 10 toes — perfect for counting to ten!",
            quiz: [
              { q: "How many fingers do you have on both hands?", options: ["10", "5", "8", "12"], answer: 0 },
              { q: "What comes after 6?", options: ["7", "5", "8", "9"], answer: 0 },
              { q: "Count the eyes of 2 people. How many?", options: ["4", "2", "3", "5"], answer: 0 }
            ]
          },
          {
            title: "More and Less", emoji: "⚖️", kicker: "Numbers",
            body: `<p>We can compare groups of things. When a group has more things, it is <strong>more</strong>. When it has fewer, it is <strong>less</strong>.</p>
              <p>🍎🍎🍎 is more than 🍎. 🍎🍎 is less than 🍎🍎🍎.</p>
              <p>Practise with your toys: make a pile of 5 stones and a pile of 2 stones. Which pile is more? The pile of 5!</p>`,
            keyFact: "The bigger the number, the more things there are.",
            quiz: [
              { q: "Which is more: 7 or 3?", options: ["7", "3", "Same", "None"], answer: 0 },
              { q: "Which is less: 2 or 9?", options: ["2", "9", "Same", "None"], answer: 0 },
              { q: "If you have 5 sweets and eat 1, how many are left?", options: ["4", "5", "6", "3"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "ecd-letters", name: "Letters & Sounds", emoji: "🔤", color: "#7C4DFF",
        desc: "Meet the alphabet and the sounds each letter makes.",
        lessons: [
          {
            title: "The Alphabet Song", emoji: "🎵", kicker: "Phonics",
            body: `<p>The alphabet has <strong>26 letters</strong>. We use letters to make words.</p>
              <p>A B C D E F G, H I J K L M N O P, Q R S, T U V, W X, Y and Z!</p>
              <p>Every letter has a sound. <strong>A</strong> says "ah", <strong>B</strong> says "buh", <strong>C</strong> says "kuh". Let us say the sounds together.</p>
              <ul><li>A — apple</li><li>B — ball</li><li>C — cat</li><li>D — dog</li></ul>`,
            keyFact: "There are 26 letters in the English alphabet: 5 vowels (A E I O U) and 21 consonants.",
            quiz: [
              { q: "How many letters are in the alphabet?", options: ["26", "20", "24", "30"], answer: 0 },
              { q: "Which of these is a vowel?", options: ["A", "B", "C", "D"], answer: 0 },
              { q: "What letter does 'ball' start with?", options: ["B", "D", "P", "A"], answer: 0 }
            ]
          },
          {
            title: "Writing My Name", emoji: "✏️", kicker: "Writing",
            body: `<p>Your name is special! Let us learn to write it.</p>
              <p>Names start with a <strong>capital letter</strong>. For example, <strong>T</strong>endai, <strong>R</strong>udo, <strong>N</strong>yasha.</p>
              <p>Practise writing your name in the air, then on paper. Remember to hold your pencil nicely and sit up straight.</p>`,
            keyFact: "Always start a name with a capital letter.",
            quiz: [
              { q: "A name should start with a…", options: ["Capital letter", "Small letter", "Number", "Symbol"], answer: 0 },
              { q: "Which is written correctly?", options: ["Tendai", "tendai", "TENDAI", "tendAi"], answer: 0 },
              { q: "How many letters are in 'Rudo'?", options: ["4", "3", "5", "2"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "ecd-animals", name: "Animals & Nature", emoji: "🦁", color: "#00A651",
        desc: "Discover Zimbabwe's amazing animals and plants.",
        lessons: [
          {
            title: "Zimbabwe's Big Animals", emoji: "🐘", kicker: "Nature",
            body: `<p>Zimbabwe is home to many wonderful animals. Let us meet some of them!</p>
              <ul><li><strong>Elephant</strong> — the biggest land animal, found at Hwange</li><li><strong>Lion</strong> — the king of the animals</li><li><strong>Zebra</strong> — black and white stripes</li><li><strong>Giraffe</strong> — the tallest animal</li><li><strong>Rhino</strong> — has a strong horn</li></ul>
              <p>We must protect our animals so they live safely in our national parks.</p>`,
            keyFact: "Hwange National Park is Zimbabwe's largest national park and has one of the biggest elephant populations in the world.",
            quiz: [
              { q: "Which is the tallest animal?", options: ["Giraffe", "Elephant", "Lion", "Zebra"], answer: 0 },
              { q: "What colours is a zebra?", options: ["Black and white", "Red and blue", "Green and yellow", "Brown and pink"], answer: 0 },
              { q: "Which animal is called the king of the animals?", options: ["Lion", "Elephant", "Rhino", "Giraffe"], answer: 0 }
            ]
          },
          {
            title: "My Body", emoji: "🙌", kicker: "Health",
            body: `<p>Your body is amazing! Let us name the parts of your body.</p>
              <ul><li>Head — for thinking</li><li>Eyes — for seeing</li><li>Ears — for hearing</li><li>Nose — for smelling</li><li>Mouth — for eating and talking</li><li>Hands — for touching and holding</li><li>Legs — for walking and running</li></ul>
              <p>Keep your body clean and healthy. Wash your hands with soap before eating!</p>`,
            keyFact: "Washing your hands with soap and clean water keeps germs away and keeps you healthy.",
            quiz: [
              { q: "Which body part do we use to see?", options: ["Eyes", "Ears", "Nose", "Legs"], answer: 0 },
              { q: "Which body part do we use to hear?", options: ["Ears", "Eyes", "Mouth", "Hands"], answer: 0 },
              { q: "Before eating we should…", options: ["Wash our hands", "Run around", "Sleep", "Shout"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "ecd-shona", name: "Shona First Words", emoji: "🗣️", color: "#00A651",
        desc: "Say your first words in Shona — greetings and family.",
        lessons: [
          {
            title: "Mhoro! Shona Greetings", emoji: "👋", kicker: "Shona",
            body: `<p>In Zimbabwe many people speak Shona. Let us learn to greet our friends and family.</p>
              <ul><li><strong>Mhoro</strong> — Hello (to one person)</li><li><strong>Mhoroi</strong> — Hello (to many people)</li><li><strong>Mangwanani</strong> — Good morning</li><li><strong>Masikati</strong> — Good afternoon</li><li><strong>Manheru</strong> — Good evening</li><li><strong>Ndarara</strong> — Good night</li></ul>
              <p>When you meet someone, smile and say <strong>Mhoro!</strong></p>`,
            keyFact: "'Mhoro' means hello in Shona. Try greeting your family today!",
            quiz: [
              { q: "What does 'Mangwanani' mean?", options: ["Good morning", "Good night", "Goodbye", "Thank you"], answer: 0 },
              { q: "How do you say hello to one person in Shona?", options: ["Mhoro", "Masikati", "Ndarara", "Mhoroi"], answer: 0 },
              { q: "What does 'Manheru' mean?", options: ["Good evening", "Good morning", "Hello", "Sorry"], answer: 0 }
            ]
          },
          {
            title: "Mhuri Yangu — My Family", emoji: "👨‍👩‍👧‍👦", kicker: "Shona",
            body: `<p>Family is very important in Zimbabwe. Let us learn the Shona words for our family.</p>
              <ul><li><strong>Amai</strong> — Mother</li><li><strong>Baba</strong> — Father</li><li><strong>Mukoma</strong> — Older brother or sister</li><li><strong>Munin'ina</strong> — Younger sibling</li><li><strong>Mbuya</strong> — Grandmother</li><li><strong>Sekuru</strong> — Grandfather</li></ul>
              <p>We say thank you as <strong>Ndatenda</strong>.</p>`,
            keyFact: "'Amai' means mother and 'Baba' means father in Shona.",
            quiz: [
              { q: "What is 'Amai'?", options: ["Mother", "Father", "Sister", "Teacher"], answer: 0 },
              { q: "What is 'Baba'?", options: ["Father", "Mother", "Uncle", "Brother"], answer: 0 },
              { q: "How do you say thank you in Shona?", options: ["Ndatenda", "Mhoro", "Amai", "Baba"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "ecd-music", name: "Music, Rhymes & Movement", emoji: "🎵", color: "#7C4DFF",
        desc: "Sing, clap and dance while you learn.",
        lessons: [
          {
            title: "Songs & Rhymes", emoji: "🎶", kicker: "Music",
            body: `<p>Music helps us learn and remember. Let us sing and clap together!</p>
              <p>Clap along to the beat: <strong>clap, clap, clap!</strong></p>
              <ul><li>Songs help us learn new words</li><li>Rhymes have words that end with the same sound, like <strong>cat</strong> and <strong>hat</strong></li><li>We can sing about numbers, colours and animals</li></ul>
              <p>Try singing the alphabet song from A to Z!</p>`,
            keyFact: "Words that rhyme end with the same sound, like 'sun' and 'fun'.",
            quiz: [
              { q: "Which two words rhyme?", options: ["Cat and hat", "Cat and dog", "Sun and moon", "Cup and plate"], answer: 0 },
              { q: "What do we do to keep the beat?", options: ["Clap", "Sleep", "Run", "Whisper"], answer: 0 },
              { q: "Songs help us learn new…", options: ["Words", "Shoes", "Rocks", "Doors"], answer: 0 }
            ]
          },
          {
            title: "Dance & Move", emoji: "💃", kicker: "Movement",
            body: `<p>Our bodies love to move! Moving keeps us strong and happy.</p>
              <ul><li><strong>Jump</strong> up and down</li><li><strong>Stretch</strong> your arms up high</li><li><strong>Hop</strong> on one leg</li><li><strong>Spin</strong> around slowly</li><li><strong>March</strong> like a soldier</li></ul>
              <p>Zimbabwean dances like <strong>Muchongoyo</strong> use drums and lots of energy!</p>`,
            keyFact: "Moving and dancing every day helps your body stay healthy and strong.",
            quiz: [
              { q: "What do we use to keep time in music?", options: ["Drums", "Spoons", "Books", "Hats"], answer: 0 },
              { q: "Which is a Zimbabwean dance?", options: ["Muchongoyo", "Ballet", "Salsa", "Hip-hop"], answer: 0 },
              { q: "Moving keeps our body…", options: ["Strong", "Weak", "Sleepy", "Cold"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "ecd-community", name: "My Community & Safety", emoji: "🏘️", color: "#FF8A00",
        desc: "Meet the people who help us and learn how to stay safe.",
        lessons: [
          {
            title: "People Who Help Us", emoji: "👮", kicker: "Community",
            body: `<p>Many people work hard to keep our community safe and happy.</p>
              <ul><li><strong>Teacher</strong> — helps us learn at school</li><li><strong>Nurse &amp; Doctor</strong> — help us when we are sick</li><li><strong>Police officer</strong> — keeps us safe</li><li><strong>Firefighter</strong> — puts out fires</li><li><strong>Farmer</strong> — grows our food</li><li><strong>Soldier</strong> — protects our country</li></ul>
              <p>Say thank you to the people who help you every day!</p>`,
            keyFact: "A nurse and a doctor help us when we are sick.",
            quiz: [
              { q: "Who helps us learn at school?", options: ["Teacher", "Farmer", "Driver", "Chef"], answer: 0 },
              { q: "Who puts out fires?", options: ["Firefighter", "Teacher", "Nurse", "Farmer"], answer: 0 },
              { q: "Who grows our food?", options: ["Farmer", "Police", "Doctor", "Pilot"], answer: 0 }
            ]
          },
          {
            title: "Staying Safe", emoji: "🚦", kicker: "Safety",
            body: `<p>We must always keep ourselves safe. Here are some important rules.</p>
              <ul><li>Look <strong>left and right</strong> before crossing the road</li><li>Hold a grown-up's hand near traffic</li><li>Never talk to strangers</li><li>Wash your hands before eating</li><li>Never play with fire or electricity</li></ul>
              <p>If you ever feel unsafe, tell a trusted adult straight away.</p>`,
            keyFact: "Always look left and right before crossing the road.",
            quiz: [
              { q: "Before crossing the road we should…", options: ["Look left and right", "Run fast", "Close our eyes", "Sing"], answer: 0 },
              { q: "Should you talk to strangers?", options: ["No", "Yes", "Sometimes", "Always"], answer: 0 },
              { q: "If you feel unsafe, tell…", options: ["A trusted adult", "Nobody", "A stranger", "A pet"], answer: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "infant",
    name: "Infant",
    fullName: "Infant School",
    ages: "Grades 1–2",
    emoji: "📗",
    cls: "lv-infant",
    tagline: "Build strong foundations in reading, writing and numbers.",
    subjects: [
      {
        id: "inf-maths", name: "Mathematics", emoji: "➕", color: "#2E9BFF",
        desc: "Counting, adding, subtracting and shapes.",
        lessons: [
          {
            title: "Adding Numbers", emoji: "➕", kicker: "Maths",
            body: `<p>Adding means putting groups together to find the <strong>total</strong>. We use the plus sign <strong>+</strong> and the equals sign <strong>=</strong>.</p>
              <p>If you have 3 oranges and you get 2 more, how many do you have? 3 + 2 = <strong>5</strong>.</p>
              <p>You can add using your fingers, counters, or by counting on. Let us try: 4 + 3 = 7, 5 + 5 = 10, 6 + 2 = 8.</p>`,
            keyFact: "When you add, the answer is called the sum. 3 + 2 = 5, so the sum is 5.",
            quiz: [
              { q: "What is 4 + 3?", options: ["7", "6", "8", "9"], answer: 0 },
              { q: "What is 5 + 5?", options: ["10", "9", "11", "8"], answer: 0 },
              { q: "What is 2 + 6?", options: ["8", "7", "9", "6"], answer: 0 }
            ]
          },
          {
            title: "Subtracting Numbers", emoji: "➖", kicker: "Maths",
            body: `<p>Subtracting means taking away. We use the minus sign <strong>−</strong>.</p>
              <p>If you have 7 sweets and eat 3, how many are left? 7 − 3 = <strong>4</strong>.</p>
              <p>Practise: 9 − 4 = 5, 8 − 2 = 6, 10 − 5 = 5.</p>`,
            keyFact: "Subtracting makes a number smaller. The answer is called the difference.",
            quiz: [
              { q: "What is 9 − 4?", options: ["5", "4", "6", "3"], answer: 0 },
              { q: "What is 10 − 5?", options: ["5", "6", "4", "7"], answer: 0 },
              { q: "What is 8 − 2?", options: ["6", "5", "7", "4"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "inf-english", name: "English", emoji: "📖", color: "#FF8A00",
        desc: "Reading, phonics and simple sentences.",
        lessons: [
          {
            title: "Building Sentences", emoji: "✍️", kicker: "English",
            body: `<p>A <strong>sentence</strong> is a group of words that makes complete sense. A sentence starts with a capital letter and ends with a full stop (.), question mark (?) or exclamation mark (!).</p>
              <p>Examples: <strong>The dog runs.</strong> <strong>I like sadza.</strong> <strong>Where is my book?</strong></p>
              <p>A sentence needs a <strong>naming word</strong> (noun) and an <strong>action word</strong> (verb).</p>`,
            keyFact: "Every sentence begins with a capital letter and ends with a punctuation mark.",
            quiz: [
              { q: "Which is a complete sentence?", options: ["The cat sleeps.", "cat the", "sleeping cat", "the"], answer: 0 },
              { q: "A sentence starts with a…", options: ["Capital letter", "Full stop", "Number", "Comma"], answer: 0 },
              { q: "Which is a verb (action word)?", options: ["run", "table", "happy", "blue"], answer: 0 }
            ]
          },
          {
            title: "Nouns and Verbs", emoji: "🏷️", kicker: "Grammar",
            body: `<p>A <strong>noun</strong> is a naming word — it names a person, place or thing: <em>boy, Harare, book, dog</em>.</p>
              <p>A <strong>verb</strong> is an action word — it tells us what someone does: <em>run, eat, sing, jump</em>.</p>
              <p>In the sentence <strong>"Rudo sings a song"</strong>, <em>Rudo</em> and <em>song</em> are nouns, and <em>sings</em> is a verb.</p>`,
            keyFact: "Nouns name things; verbs show action.",
            quiz: [
              { q: "Which word is a noun?", options: ["Harare", "run", "quickly", "jump"], answer: 0 },
              { q: "Which word is a verb?", options: ["sing", "chair", "happy", "green"], answer: 0 },
              { q: "In 'Tapiwa kicks the ball', which is the verb?", options: ["kicks", "Tapiwa", "ball", "the"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "inf-shona", name: "Shona", emoji: "🇿🇼", color: "#00A651",
        desc: "ChiShona basics: greetings, numbers and family.",
        lessons: [
          {
            title: "Mhoro! Greetings in Shona", emoji: "👋", kicker: "ChiShona",
            body: `<p>Let us learn to greet in Shona!</p>
              <ul><li><strong>Mhoro</strong> — Hello (to one person)</li><li><strong>Mhoroi</strong> — Hello (to many people)</li><li><strong>Mangwanani</strong> — Good morning</li><li><strong>Masikati</strong> — Good afternoon</li><li><strong>Manheru</strong> — Good evening</li><li><strong>Wakadini?</strong> — How are you?</li><li><strong>Ndiripo</strong> — I am fine</li></ul>
              <p>Practise greeting your family in Shona every day!</p>`,
            keyFact: "In Shona, 'Mangwanani' means 'Good morning'.",
            quiz: [
              { q: "What does 'Mangwanani' mean?", options: ["Good morning", "Good night", "Goodbye", "Thank you"], answer: 0 },
              { q: "How do you say 'Hello' to one person?", options: ["Mhoro", "Mhoroi", "Manheru", "Masikati"], answer: 0 },
              { q: "What does 'Wakadini?' mean?", options: ["How are you?", "What is your name?", "Where are you?", "How old are you?"], answer: 0 }
            ]
          },
          {
            title: "Nhamba — Numbers in Shona", emoji: "🔢", kicker: "ChiShona",
            body: `<p>Let us count in Shona!</p>
              <ul><li>1 — poshi / imwe</li><li>2 — piri / mbiri</li><li>3 — tatu / nhatu</li><li>4 — ina</li><li>5 — shanu</li><li>6 — tanhatu</li><li>7 — nomwe</li><li>8 — sere</li><li>9 — pfumbamwe</li><li>10 — gumi</li></ul>
              <p>Count your fingers in Shona: imwe, piri, tatu, ina, shanu!</p>`,
            keyFact: "'Gumi' means ten in Shona.",
            quiz: [
              { q: "What is 'shanu' in English?", options: ["5", "3", "7", "10"], answer: 0 },
              { q: "How do you say '10' in Shona?", options: ["Gumi", "Shanu", "Ina", "Tatu"], answer: 0 },
              { q: "What is 'tatu'?", options: ["3", "2", "4", "5"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "inf-ndebele", name: "Ndebele", emoji: "🗣️", color: "#7C4DFF",
        desc: "isiNdebele basics: greetings and numbers.",
        lessons: [
          {
            title: "Salibonani! Greetings in Ndebele", emoji: "👋", kicker: "isiNdebele",
            body: `<p>Let us learn to greet in Ndebele!</p>
              <ul><li><strong>Salibonani</strong> — Hello (to many)</li><li><strong>Sawubona</strong> — Hello (to one)</li><li><strong>Livukile</strong> — Good morning</li><li><strong>Litshonile</strong> — Good afternoon/evening</li><li><strong>Unjani?</strong> — How are you?</li><li><strong>Ngiyaphila</strong> — I am fine</li></ul>
              <p>Practise greeting your friends and family in Ndebele!</p>`,
            keyFact: "'Sawubona' is used to greet one person in Ndebele.",
            quiz: [
              { q: "What does 'Sawubona' mean?", options: ["Hello (to one)", "Goodbye", "Thank you", "Good night"], answer: 0 },
              { q: "How do you say 'I am fine'?", options: ["Ngiyaphila", "Unjani?", "Salibonani", "Livukile"], answer: 0 },
              { q: "What does 'Unjani?' mean?", options: ["How are you?", "What is your name?", "Where are you?", "How old are you?"], answer: 0 }
            ]
          },
          {
            title: "Izinombolo — Numbers in Ndebele", emoji: "🔢", kicker: "isiNdebele",
            body: `<p>Let us count in Ndebele!</p>
              <ul><li>1 — kunye</li><li>2 — kubili</li><li>3 — kuthathu</li><li>4 — kune</li><li>5 — kuhlanu</li><li>6 — isithupha</li><li>7 — isikhombisa</li><li>8 — isishiyagalombili</li><li>9 — isishiyagalolunye</li><li>10 — ishumi</li></ul>`,
            keyFact: "'Ishumi' means ten in Ndebele.",
            quiz: [
              { q: "What is 'kuhlanu'?", options: ["5", "4", "6", "3"], answer: 0 },
              { q: "How do you say '10' in Ndebele?", options: ["Ishumi", "Kuhlanu", "Kune", "Kuthathu"], answer: 0 },
              { q: "What is 'kubili'?", options: ["2", "1", "3", "4"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "inf-science", name: "Environmental Science", emoji: "🌱", color: "#00A651",
        desc: "Discover plants, animals and the world around us.",
        lessons: [
          {
            title: "Plants Around Us", emoji: "🌳", kicker: "Science",
            body: `<p>Plants are living things. They grow in gardens, farms and forests all over Zimbabwe.</p>
              <p>The main parts of a plant are:</p>
              <ul><li><strong>Roots</strong> — hold the plant and take in water</li><li><strong>Stem</strong> — carries water up the plant</li><li><strong>Leaves</strong> — make food using sunlight</li><li><strong>Flower</strong> — makes seeds</li></ul>
              <p>Plants need <strong>water</strong>, <strong>sunlight</strong>, <strong>air</strong> and <strong>soil</strong> to grow.</p>`,
            keyFact: "Leaves make food for the plant using sunlight, water and air.",
            quiz: [
              { q: "Which part takes in water from the soil?", options: ["Roots", "Leaves", "Flower", "Stem"], answer: 0 },
              { q: "What do plants need to make food?", options: ["Sunlight", "Darkness", "Plastic", "Noise"], answer: 0 },
              { q: "Which part makes seeds?", options: ["Flower", "Roots", "Stem", "Soil"], answer: 0 }
            ]
          },
          {
            title: "Animals and Their Homes", emoji: "🐘", kicker: "Science",
            body: `<p>Every animal has a home called a <strong>habitat</strong>.</p>
              <ul><li><strong>Lion</strong> — lives in the savanna grassland</li><li><strong>Elephant</strong> — lives in the bush and national parks</li><li><strong>Fish</strong> — lives in rivers and dams</li><li><strong>Bird</strong> — lives in a nest in a tree</li><li><strong>Bee</strong> — lives in a hive</li></ul>
              <p>Zimbabwe's biggest national park is <strong>Hwange</strong>, home to elephants and lions.</p>`,
            keyFact: "A habitat is the natural home of an animal, like a river for a fish.",
            quiz: [
              { q: "Where does a fish live?", options: ["In water", "In a tree", "In a cave", "In sand"], answer: 0 },
              { q: "What is an animal's home called?", options: ["Habitat", "Holiday", "Hotel", "Habit"], answer: 0 },
              { q: "Zimbabwe's biggest national park is…", options: ["Hwange", "Kariba", "Mutare", "Gweru"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "inf-health", name: "Health & Hygiene", emoji: "🧼", color: "#2E9BFF",
        desc: "Build healthy habits for a strong body.",
        lessons: [
          {
            title: "Keeping Clean & Healthy", emoji: "🧼", kicker: "Health",
            body: `<p>Good habits keep us clean and free from germs.</p>
              <ul><li>Wash your hands with soap before eating and after the toilet</li><li>Brush your teeth twice a day</li><li>Bathe every day</li><li>Cut your nails and keep them clean</li><li>Cover your mouth when you cough or sneeze</li></ul>
              <p>Germs are tiny living things that can make us sick. Soap and clean water wash germs away.</p>`,
            keyFact: "Washing hands with soap is the best way to stop germs spreading.",
            quiz: [
              { q: "When should you wash your hands?", options: ["Before eating", "Never", "Only on Sunday", "After playing only"], answer: 0 },
              { q: "How many times a day should you brush your teeth?", options: ["Twice", "Once a week", "Never", "Ten times"], answer: 0 },
              { q: "What washes germs away?", options: ["Soap and water", "Dirt", "Oil", "Sand"], answer: 0 }
            ]
          },
          {
            title: "Healthy Food & Clean Water", emoji: "🍎", kicker: "Health",
            body: `<p>Eating well gives us energy to learn and play.</p>
              <ul><li><strong>Fruits</strong> — mangoes, bananas, oranges</li><li><strong>Vegetables</strong> — covo, spinach, tomatoes</li><li><strong>Grains</strong> — sadza, rice, bread</li><li><strong>Protein</strong> — beans, eggs, chicken, fish</li><li><strong>Water</strong> — drink clean water every day</li></ul>
              <p>Always boil or treat water if you are not sure it is clean.</p>`,
            keyFact: "Eating fruits and vegetables every day keeps you strong and healthy.",
            quiz: [
              { q: "Which of these is a fruit?", options: ["Mango", "Covo", "Sadza", "Beans"], answer: 0 },
              { q: "Which drink is best for your body?", options: ["Clean water", "Fizzy drinks", "Coffee", "Nothing"], answer: 0 },
              { q: "Sadza is made from…", options: ["Maize", "Milk", "Sugar", "Salt"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "inf-zim", name: "Zimbabwe Our Home", emoji: "🇿🇼", color: "#FFB300",
        desc: "Learn about our beautiful country, its flag and famous places.",
        lessons: [
          {
            title: "Our Country Zimbabwe", emoji: "🇿🇼", kicker: "Social Studies",
            body: `<p>Zimbabwe is our beautiful home country in southern Africa.</p>
              <ul><li><strong>Capital city</strong> — Harare</li><li><strong>Second city</strong> — Bulawayo</li><li><strong>Languages</strong> — Shona, Ndebele and English</li><li><strong>Currency</strong> — we buy and sell goods every day</li></ul>
              <p>Our flag has four colours: <strong>green</strong>, <strong>yellow</strong>, <strong>red</strong> and <strong>black</strong>, with a bird and a white triangle.</p>`,
            keyFact: "Harare is the capital city of Zimbabwe.",
            quiz: [
              { q: "What is the capital city of Zimbabwe?", options: ["Harare", "Bulawayo", "Mutare", "Gweru"], answer: 0 },
              { q: "How many colours are on the Zimbabwe flag?", options: ["Four", "Two", "One", "Six"], answer: 0 },
              { q: "Which language is NOT official in Zimbabwe?", options: ["French", "Shona", "Ndebele", "English"], answer: 0 }
            ]
          },
          {
            title: "Famous Places", emoji: "🏞️", kicker: "Social Studies",
            body: `<p>Zimbabwe has amazing places that people travel from all over the world to see.</p>
              <ul><li><strong>Victoria Falls</strong> — the biggest waterfall in the world, called <em>Mosi-oa-Tunya</em></li><li><strong>Great Zimbabwe</strong> — ancient stone city built long ago</li><li><strong>Hwange</strong> — our biggest national park</li><li><strong>Lake Kariba</strong> — a huge lake full of fish</li></ul>
              <p>These wonders make us proud to be Zimbabwean!</p>`,
            keyFact: "Victoria Falls is known as 'Mosi-oa-Tunya' — the smoke that thunders.",
            quiz: [
              { q: "What is the local name for Victoria Falls?", options: ["Mosi-oa-Tunya", "Kariba", "Hwange", "Harare"], answer: 0 },
              { q: "Great Zimbabwe is made of…", options: ["Stone", "Wood", "Glass", "Ice"], answer: 0 },
              { q: "Lake Kariba is famous for…", options: ["Fish", "Snow", "Deserts", "Volcanoes"], answer: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "junior",
    name: "Junior",
    fullName: "Junior School",
    ages: "Grades 3–7",
    emoji: "📘",
    cls: "lv-junior",
    tagline: "Explore science, social studies and prepare for Grade 7 exams.",
    subjects: [
      {
        id: "jun-maths", name: "Mathematics", emoji: "🧮", color: "#2E9BFF",
        desc: "Multiplication, fractions, decimals and problem solving.",
        lessons: [
          {
            title: "Multiplication Tables", emoji: "✖️", kicker: "Maths",
            body: `<p>Multiplication is repeated addition. 3 × 4 means 3 + 3 + 3 + 3 = 12.</p>
              <p>Learn your times tables. They help you solve problems quickly.</p>
              <ul><li>2 × 6 = 12</li><li>5 × 7 = 35</li><li>8 × 9 = 72</li><li>7 × 7 = 49</li></ul>
              <p>The multiplication sign (×) can also be written as a dot (·).</p>`,
            keyFact: "Any number multiplied by zero equals zero. 5 × 0 = 0.",
            quiz: [
              { q: "What is 7 × 8?", options: ["56", "54", "48", "64"], answer: 0 },
              { q: "What is 6 × 9?", options: ["54", "56", "63", "45"], answer: 0 },
              { q: "What is 12 × 3?", options: ["36", "33", "39", "30"], answer: 0 }
            ]
          },
          {
            title: "Fractions", emoji: "🍕", kicker: "Maths",
            body: `<p>A <strong>fraction</strong> shows part of a whole. It has a <strong>numerator</strong> (top number) and a <strong>denominator</strong> (bottom number).</p>
              <p>If you cut a pizza into 4 equal slices and eat 1, you have eaten <strong>1/4</strong> (one quarter).</p>
              <p>Equivalent fractions are equal: 1/2 = 2/4 = 4/8.</p>
              <ul><li>1/2 — one half</li><li>1/4 — one quarter</li><li>3/4 — three quarters</li></ul>`,
            keyFact: "In the fraction 3/4, the 3 is the numerator and the 4 is the denominator.",
            quiz: [
              { q: "In 3/5, which number is the denominator?", options: ["5", "3", "8", "2"], answer: 0 },
              { q: "Which fraction equals one half?", options: ["2/4", "1/4", "3/4", "1/3"], answer: 0 },
              { q: "If you eat 2 of 4 slices, what fraction did you eat?", options: ["2/4", "1/4", "4/2", "3/4"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "jun-english", name: "English", emoji: "📚", color: "#FF8A00",
        desc: "Comprehension, tenses, punctuation and writing.",
        lessons: [
          {
            title: "Tenses: Past, Present, Future", emoji: "⏳", kicker: "Grammar",
            body: `<p><strong>Tense</strong> tells us when an action happens.</p>
              <ul><li><strong>Present</strong> — happening now: <em>I eat sadza.</em></li><li><strong>Past</strong> — already happened: <em>I ate sadza.</em></li><li><strong>Future</strong> — will happen: <em>I will eat sadza.</em></li></ul>
              <p>Notice how the verb changes: eat → ate → will eat. Some verbs add "-ed" for the past: walk → walked.</p>`,
            keyFact: "The present tense describes things happening now or facts that are always true.",
            quiz: [
              { q: "Which sentence is in the past tense?", options: ["She walked to school.", "She walks to school.", "She will walk to school.", "She is walking."], answer: 0 },
              { q: "Change 'play' to future tense.", options: ["will play", "played", "playing", "plays"], answer: 0 },
              { q: "Which is present tense?", options: ["He runs.", "He ran.", "He will run.", "He had run."], answer: 0 }
            ]
          },
          {
            title: "Punctuation", emoji: "❗", kicker: "Writing",
            body: `<p>Punctuation marks help us read and understand writing.</p>
              <ul><li><strong>Full stop (.)</strong> — ends a statement</li><li><strong>Question mark (?)</strong> — ends a question</li><li><strong>Exclamation mark (!)</strong> — shows strong feeling</li><li><strong>Comma (,)</strong> — separates items in a list</li><li><strong>Capital letter</strong> — starts sentences and names</li></ul>
              <p>Example: <em>I bought mangoes, bananas and oranges.</em></p>`,
            keyFact: "Use a question mark at the end of a sentence that asks something.",
            quiz: [
              { q: "Which mark ends a question?", options: ["?", ".", "!", ","], answer: 0 },
              { q: "Which mark shows strong feeling?", options: ["!", ".", "?", ","], answer: 0 },
              { q: "What do we use to separate items in a list?", options: [",", ".", "!", "?"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "jun-science", name: "Science", emoji: "🔬", color: "#00C2A8",
        desc: "Living things, the human body, matter and energy.",
        lessons: [
          {
            title: "Living and Non-Living Things", emoji: "🌱", kicker: "Biology",
            body: `<p>Living things can grow, move, breathe, feed and reproduce. Non-living things cannot do these things.</p>
              <p>Living things: plants, animals, people, trees. Non-living things: rocks, water, chairs, cars.</p>
              <p>All living things need certain things to survive: <strong>air, water, food, and shelter</strong>.</p>`,
            keyFact: "The 7 life processes are: movement, respiration, sensitivity, growth, reproduction, excretion and nutrition (MRS GREN).",
            quiz: [
              { q: "Which of these is a living thing?", options: ["Tree", "Rock", "Chair", "Car"], answer: 0 },
              { q: "What do all living things need to breathe?", options: ["Air", "Sand", "Plastic", "Metal"], answer: 0 },
              { q: "Which is NOT a life process?", options: ["Freezing", "Growth", "Reproduction", "Nutrition"], answer: 0 }
            ]
          },
          {
            title: "States of Matter", emoji: "💧", kicker: "Chemistry",
            body: `<p>Matter exists in three main states: <strong>solid, liquid and gas</strong>.</p>
              <ul><li><strong>Solid</strong> — has a fixed shape (ice, stone, wood)</li><li><strong>Liquid</strong> — flows and takes the shape of its container (water, milk)</li><li><strong>Gas</strong> — fills any space (air, steam)</li></ul>
              <p>When water is heated it becomes steam (gas). When it is cooled it becomes ice (solid). This is called a change of state.</p>`,
            keyFact: "Water freezes at 0°C and boils at 100°C.",
            quiz: [
              { q: "Which is a gas?", options: ["Steam", "Ice", "Water", "Stone"], answer: 0 },
              { q: "At what temperature does water freeze?", options: ["0°C", "100°C", "50°C", "10°C"], answer: 0 },
              { q: "Which state has a fixed shape?", options: ["Solid", "Liquid", "Gas", "None"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "jun-social", name: "Social Studies", emoji: "🗺️", color: "#FFB300",
        desc: "Zimbabwe's provinces, history and citizenship.",
        lessons: [
          {
            title: "Provinces of Zimbabwe", emoji: "📍", kicker: "Geography",
            body: `<p>Zimbabwe has <strong>10 provinces</strong> and 2 metropolitan provinces (Harare and Bulawayo).</p>
              <ul><li>Harare (capital city)</li><li>Bulawayo</li><li>Manicaland</li><li>Mashonaland Central</li><li>Mashonaland East</li><li>Mashonaland West</li><li>Masvingo</li><li>Matabeleland North</li><li>Matabeleland South</li><li>Midlands</li></ul>
              <p>Harare is the capital city of Zimbabwe. Bulawayo is the second largest city.</p>`,
            keyFact: "Zimbabwe's capital city is Harare. The country has 8 provinces plus 2 cities with provincial status.",
            quiz: [
              { q: "What is the capital city of Zimbabwe?", options: ["Harare", "Bulawayo", "Mutare", "Gweru"], answer: 0 },
              { q: "How many provinces does Zimbabwe have (including the 2 cities)?", options: ["10", "8", "12", "6"], answer: 0 },
              { q: "Which is Zimbabwe's second largest city?", options: ["Bulawayo", "Harare", "Masvingo", "Chinhoyi"], answer: 0 }
            ]
          },
          {
            title: "Independence and the Flag", emoji: "🇿🇼", kicker: "History",
            body: `<p>Zimbabwe gained independence on <strong>18 April 1980</strong>.</p>
              <p>Our national flag has important colours:</p>
              <ul><li><strong>Green</strong> — agriculture and vegetation</li><li><strong>Yellow</strong> — mineral wealth</li><li><strong>Red</strong> — blood shed during the liberation struggle</li><li><strong>Black</strong> — the black majority</li><li><strong>White triangle</strong> — peace</li><li><strong>Zimbabwe Bird</strong> — national symbol</li></ul>`,
            keyFact: "Zimbabwe celebrates Independence Day on 18 April every year.",
            quiz: [
              { q: "When did Zimbabwe gain independence?", options: ["18 April 1980", "18 April 1970", "1 January 1980", "18 May 1980"], answer: 0 },
              { q: "What does the green on the flag represent?", options: ["Agriculture", "Blood", "Minerals", "Peace"], answer: 0 },
              { q: "What bird is on the Zimbabwe flag?", options: ["Zimbabwe Bird", "Eagle", "Dove", "Flamingo"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "jun-agric", name: "Agriculture", emoji: "🌾", color: "#00A651",
        desc: "Farming, crops, soil and livestock.",
        lessons: [
          {
            title: "Crops We Grow", emoji: "🌽", kicker: "Agriculture",
            body: `<p>Agriculture is very important in Zimbabwe. Farmers grow many crops.</p>
              <ul><li><strong>Maize</strong> — used to make sadza, our staple food</li><li><strong>Tobacco</strong> — a major export crop</li><li><strong>Cotton</strong> — used for clothes</li><li><strong>Groundnuts</strong> — for eating and oil</li><li><strong>Vegetables</strong> — tomatoes, onions, cabbage</li></ul>
              <p>Farmers need good soil, water, sunlight and care to grow healthy crops.</p>`,
            keyFact: "Maize is Zimbabwe's most important food crop — it is used to make sadza.",
            quiz: [
              { q: "Which crop is used to make sadza?", options: ["Maize", "Cotton", "Tobacco", "Tea"], answer: 0 },
              { q: "Which crop is a major export for Zimbabwe?", options: ["Tobacco", "Rice", "Wheat", "Grapes"], answer: 0 },
              { q: "What do plants need to grow well?", options: ["Water and sunlight", "Only rocks", "Plastic", "Darkness"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "jun-ict", name: "Information Technology", emoji: "💻", color: "#2E9BFF",
        desc: "Learn how computers work and how to use the internet safely.",
        lessons: [
          {
            title: "Introduction to Computers", emoji: "💻", kicker: "ICT",
            body: `<p>Computers are everywhere — in schools, banks, shops and homes. A computer helps us work faster and learn more.</p>
              <p>The main parts of a computer are:</p>
              <ul><li><strong>Monitor</strong> — the screen we look at</li><li><strong>Keyboard</strong> — for typing</li><li><strong>Mouse</strong> — for pointing and clicking</li><li><strong>CPU</strong> — the 'brain' that does the thinking</li><li><strong>Hard drive</strong> — stores our files</li></ul>
              <p><strong>Hardware</strong> is the parts you can touch. <strong>Software</strong> is the programs you use.</p>`,
            keyFact: "The CPU is often called the 'brain' of the computer.",
            quiz: [
              { q: "Which part is the 'brain' of the computer?", options: ["CPU", "Mouse", "Monitor", "Keyboard"], answer: 0 },
              { q: "Which of these is hardware?", options: ["Keyboard", "A game", "A website", "An email"], answer: 0 },
              { q: "The monitor is used to…", options: ["See the screen", "Type", "Print", "Store files"], answer: 0 }
            ]
          },
          {
            title: "Using the Internet Safely", emoji: "🌐", kicker: "ICT",
            body: `<p>The internet connects computers all over the world. It is great for learning, but we must stay safe.</p>
              <ul><li>Never share your full name, address or passwords</li><li>Use strong passwords with letters, numbers and symbols</li><li>Do not talk to strangers online</li><li>Tell a trusted adult if something makes you uncomfortable</li><li>Always give credit to your sources when you research</li></ul>
              <p>Think before you click, type or share anything online.</p>`,
            keyFact: "A strong password uses letters, numbers and symbols, and is kept secret.",
            quiz: [
              { q: "Which is a safe online habit?", options: ["Keeping passwords secret", "Sharing your address", "Talking to strangers", "Using '1234'"], answer: 0 },
              { q: "A strong password should have…", options: ["Letters, numbers and symbols", "Only your name", "Only numbers", "Nothing"], answer: 0 },
              { q: "If something online upsets you, you should…", options: ["Tell a trusted adult", "Keep it secret", "Share it", "Ignore it forever"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "jun-health", name: "Health & Physical Education", emoji: "🏃", color: "#00A651",
        desc: "Stay fit and healthy with good food and exercise.",
        lessons: [
          {
            title: "Nutrition & Balanced Diet", emoji: "🥗", kicker: "Health",
            body: `<p>A balanced diet gives our body all the nutrients it needs to grow and stay strong.</p>
              <p>The main food groups are:</p>
              <ul><li><strong>Carbohydrates</strong> — sadza, rice, bread (energy)</li><li><strong>Proteins</strong> — beans, eggs, meat, fish (growth and repair)</li><li><strong>Vitamins &amp; minerals</strong> — fruits and vegetables (health and protection)</li><li><strong>Fats</strong> — cooking oil, nuts (energy and warmth)</li><li><strong>Water</strong> — keeps the body working well</li></ul>
              <p>Eating too much sugar and junk food can make us unhealthy.</p>`,
            keyFact: "A balanced diet includes foods from all the main food groups.",
            quiz: [
              { q: "Which food group gives us energy?", options: ["Carbohydrates", "Water", "Vitamins", "Minerals"], answer: 0 },
              { q: "Proteins help the body to…", options: ["Grow and repair", "Sleep", "Freeze", "Shrink"], answer: 0 },
              { q: "Which is a healthy snack?", options: ["Fruit", "Sweets", "Crisps", "Fizzy drink"], answer: 0 }
            ]
          },
          {
            title: "Exercise & Fitness", emoji: "🏃", kicker: "Physical Education",
            body: `<p>Exercise keeps our heart, muscles and mind healthy. Children should be active for at least one hour every day.</p>
              <ul><li><strong>Running</strong> — builds a strong heart</li><li><strong>Jumping</strong> — strengthens bones and muscles</li><li><strong>Stretching</strong> — keeps us flexible</li><li><strong>Team sports</strong> — football, netball, athletics</li></ul>
              <p>Warm up before exercise and drink water afterwards. Rest is important too!</p>`,
            keyFact: "Exercise keeps your heart strong and your mind sharp.",
            quiz: [
              { q: "How long should children exercise each day?", options: ["At least 1 hour", "1 minute", "Never", "10 hours"], answer: 0 },
              { q: "Running helps build a strong…", options: ["Heart", "Shoe", "Book", "Hat"], answer: 0 },
              { q: "Before exercise you should…", options: ["Warm up", "Sleep", "Eat a lot", "Do nothing"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "jun-money", name: "Business & Money Skills", emoji: "💰", color: "#FFB300",
        desc: "Learn to save, budget and understand money.",
        lessons: [
          {
            title: "Saving & Budgeting", emoji: "🐷", kicker: "Business",
            body: `<p>Saving money means keeping some aside for later instead of spending it all now.</p>
              <ul><li><strong>Income</strong> — money you receive</li><li><strong>Expenses</strong> — money you spend</li><li><strong>Savings</strong> — money you keep for the future</li></ul>
              <p>A <strong>budget</strong> is a plan for your money. If you get $10 pocket money, you could save $5 and spend $5. Saving a little every week adds up over time!</p>`,
            keyFact: "A budget is a plan for how to save and spend your money.",
            quiz: [
              { q: "What is a budget?", options: ["A plan for money", "A type of food", "A game", "A song"], answer: 0 },
              { q: "Money you keep for later is called…", options: ["Savings", "Expenses", "Income", "Debt"], answer: 0 },
              { q: "If you save $5 every week, after 4 weeks you have…", options: ["$20", "$5", "$9", "$40"], answer: 0 }
            ]
          },
          {
            title: "Needs and Wants", emoji: "🛒", kicker: "Business",
            body: `<p>Before we spend money, we must think: is it a <strong>need</strong> or a <strong>want</strong>?</p>
              <ul><li><strong>Needs</strong> — things we must have to live: food, water, shelter, school fees, medicine</li><li><strong>Wants</strong> — things that are nice to have but not essential: sweets, toys, extra games</li></ul>
              <p>Smart people buy their <strong>needs</strong> first, then save for their <strong>wants</strong>. Buying and selling goods is how markets work.</p>`,
            keyFact: "Needs are essential for life; wants are nice to have but not essential.",
            quiz: [
              { q: "Which of these is a need?", options: ["Food", "Sweets", "Toys", "Games"], answer: 0 },
              { q: "Which of these is a want?", options: ["Sweets", "Water", "Shelter", "Medicine"], answer: 0 },
              { q: "We should buy our ___ first.", options: ["Needs", "Wants", "Toys", "Sweets"], answer: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "olevel",
    name: "O-Level",
    fullName: "Ordinary Level",
    ages: "Forms 1–4",
    emoji: "🎓",
    cls: "lv-olevel",
    tagline: "Master your ZIMSEC subjects and ace your O-Level exams.",
    subjects: [
      {
        id: "olevel-maths", name: "Mathematics", emoji: "📐", color: "#2E9BFF",
        desc: "Algebra, geometry, trigonometry and statistics.",
        lessons: [
          {
            title: "Solving Linear Equations", emoji: "🧩", kicker: "Algebra",
            body: `<p>A <strong>linear equation</strong> has a variable (like x) that we must find. Our goal is to get the variable alone on one side.</p>
              <p>Example: Solve 2x + 3 = 11.</p>
              <ul><li>Subtract 3 from both sides: 2x = 8</li><li>Divide both sides by 2: x = 4</li></ul>
              <p>Always do the same operation to both sides to keep the equation balanced.</p>`,
            keyFact: "Whatever you do to one side of an equation, you must do to the other side.",
            quiz: [
              { q: "Solve: 2x + 3 = 11", options: ["x = 4", "x = 7", "x = 5", "x = 8"], answer: 0 },
              { q: "Solve: x − 5 = 9", options: ["x = 14", "x = 4", "x = 45", "x = 13"], answer: 0 },
              { q: "Solve: 3x = 21", options: ["x = 7", "x = 6", "x = 8", "x = 63"], answer: 0 }
            ]
          },
          {
            title: "Pythagoras' Theorem", emoji: "📐", kicker: "Geometry",
            body: `<p><strong>Pythagoras' theorem</strong> works for right-angled triangles. It says:</p>
              <p style="text-align:center;font-size:22px"><strong>a² + b² = c²</strong></p>
              <p>where <em>c</em> is the longest side (hypotenuse) and <em>a</em> and <em>b</em> are the other two sides.</p>
              <p>Example: If a = 3 and b = 4, then c² = 3² + 4² = 9 + 16 = 25, so c = 5.</p>`,
            keyFact: "The hypotenuse is always the longest side and is opposite the right angle.",
            quiz: [
              { q: "In a right triangle with sides 3 and 4, what is the hypotenuse?", options: ["5", "6", "7", "12"], answer: 0 },
              { q: "Pythagoras' theorem states…", options: ["a² + b² = c²", "a + b = c", "a² − b² = c²", "abc = 1"], answer: 0 },
              { q: "The hypotenuse is always the…", options: ["Longest side", "Shortest side", "Middle side", "Equal side"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "olevel-english", name: "English Language", emoji: "📝", color: "#FF8A00",
        desc: "Comprehension, summary, grammar and composition.",
        lessons: [
          {
            title: "Summary Writing", emoji: "📄", kicker: "Comprehension",
            body: `<p>A <strong>summary</strong> is a short version of a longer text that keeps only the main points.</p>
              <p>Steps to write a good summary:</p>
              <ul><li>Read the passage carefully</li><li>Identify the main ideas (not examples)</li><li>Write in your own words where possible</li><li>Keep to the word limit</li><li>Use linking words like "firstly", "also", "finally"</li></ul>`,
            keyFact: "A summary should contain only the main points and no unnecessary detail.",
            quiz: [
              { q: "A summary should contain…", options: ["Main points only", "Every detail", "Only examples", "The writer's name"], answer: 0 },
              { q: "Which is a good linking word for summaries?", options: ["Firstly", "Maybe", "Perhaps", "Somehow"], answer: 0 },
              { q: "A summary should be…", options: ["Short", "Very long", "A copy of the text", "In a different language"], answer: 0 }
            ]
          },
          {
            title: "Direct and Indirect Speech", emoji: "💬", kicker: "Grammar",
            body: `<p><strong>Direct speech</strong> uses the exact words of the speaker in quotation marks: <em>She said, "I am tired."</em></p>
              <p><strong>Indirect speech</strong> reports what was said without quotation marks: <em>She said that she was tired.</em></p>
              <p>When changing to indirect speech, the tense usually moves back one step and pronouns change.</p>`,
            keyFact: "In indirect speech, present tense often changes to past tense.",
            quiz: [
              { q: "Which uses direct speech?", options: ['He said, "I am happy."', "He said he was happy.", "He was happy.", "He is happy."], answer: 0 },
              { q: "In indirect speech, 'am' usually becomes…", options: ["was", "is", "be", "will be"], answer: 0 },
              { q: "Direct speech uses…", options: ["Quotation marks", "No punctuation", "Only commas", "Brackets"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "olevel-science", name: "Combined Science", emoji: "⚗️", color: "#00C2A8",
        desc: "Biology, chemistry and physics essentials.",
        lessons: [
          {
            title: "Cells — The Building Blocks of Life", emoji: "🧫", kicker: "Biology",
            body: `<p>All living things are made of <strong>cells</strong>. The cell is the basic unit of life.</p>
              <p>Plant and animal cells share: <strong>cell membrane, cytoplasm, nucleus</strong>. Plant cells also have a <strong>cell wall, chloroplasts and a large vacuole</strong>.</p>
              <ul><li><strong>Nucleus</strong> — controls the cell</li><li><strong>Cytoplasm</strong> — where reactions happen</li><li><strong>Cell membrane</strong> — controls what enters and leaves</li></ul>`,
            keyFact: "Plant cells have a cell wall and chloroplasts; animal cells do not.",
            quiz: [
              { q: "Which part controls the cell?", options: ["Nucleus", "Cytoplasm", "Membrane", "Vacuole"], answer: 0 },
              { q: "Which is found in plant cells but not animal cells?", options: ["Cell wall", "Nucleus", "Cytoplasm", "Membrane"], answer: 0 },
              { q: "The basic unit of life is the…", options: ["Cell", "Atom", "Organ", "Tissue"], answer: 0 }
            ]
          },
          {
            title: "The Periodic Table", emoji: "🧪", kicker: "Chemistry",
            body: `<p>The <strong>periodic table</strong> lists all the chemical elements arranged by their atomic number.</p>
              <p>Each element has a <strong>symbol</strong>: H = hydrogen, O = oxygen, Na = sodium, Fe = iron.</p>
              <p>Elements are arranged in <strong>groups</strong> (columns) and <strong>periods</strong> (rows). Elements in the same group have similar properties.</p>`,
            keyFact: "The chemical symbol for sodium is Na (from the Latin 'natrium').",
            quiz: [
              { q: "What is the symbol for oxygen?", options: ["O", "Ox", "Og", "On"], answer: 0 },
              { q: "The periodic table is arranged by…", options: ["Atomic number", "Colour", "Weight only", "Alphabet"], answer: 0 },
              { q: "What is the symbol for sodium?", options: ["Na", "So", "Sd", "N"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "olevel-history", name: "History", emoji: "🏛️", color: "#FFB300",
        desc: "Zimbabwe and world history.",
        lessons: [
          {
            title: "Great Zimbabwe", emoji: "🏰", kicker: "History",
            body: `<p><strong>Great Zimbabwe</strong> was a powerful medieval city in the south-east of Zimbabwe, built between the 11th and 15th centuries.</p>
              <p>It was built by the <strong>Shona</strong> ancestors of the modern Shona people, using large stone blocks without any mortar.</p>
              <p>The city was the centre of a great trading empire that traded gold and ivory with Arab and Swahili traders on the coast. The country Zimbabwe is named after these ruins.</p>`,
            keyFact: "The name 'Zimbabwe' comes from the Shona words meaning 'houses of stone'.",
            quiz: [
              { q: "Who built Great Zimbabwe?", options: ["The Shona", "The British", "The Portuguese", "The Zulu"], answer: 0 },
              { q: "Great Zimbabwe was built using…", options: ["Stone without mortar", "Wood", "Bricks and cement", "Mud only"], answer: 0 },
              { q: "What does 'Zimbabwe' mean?", options: ["Houses of stone", "Great river", "Land of gold", "Place of kings"], answer: 0 }
            ]
          },
          {
            title: "The Liberation Struggle", emoji: "✊", kicker: "History",
            body: `<p>Zimbabweans fought for independence from British colonial rule in a long struggle known as the <strong>Chimurenga</strong> (liberation war).</p>
              <p>The First Chimurenga (1896–97) was led by spirit mediums <strong>Mbuya Nehanda</strong> and <strong>Sekuru Kaguvi</strong>. The Second Chimurenga (1960s–1979) led to independence in 1980.</p>
              <p>On <strong>18 April 1980</strong>, Zimbabwe became an independent nation.</p>`,
            keyFact: "Mbuya Nehanda was a famous spirit medium who inspired the First Chimurenga.",
            quiz: [
              { q: "What was the liberation war called?", options: ["Chimurenga", "Umkhonto", "Intifada", "Blitz"], answer: 0 },
              { q: "Who inspired the First Chimurenga?", options: ["Mbuya Nehanda", "Queen Victoria", "Cecil Rhodes", "David Livingstone"], answer: 0 },
              { q: "Zimbabwe became independent in…", options: ["1980", "1970", "1965", "1990"], answer: 0 }
            ]
          }
        ]
      },
      {
        id: "olevel-geography", name: "Geography", emoji: "🌍", color: "#7C4DFF",
        desc: "Physical and human geography.",
        lessons: [
          {
            title: "The Water Cycle", emoji: "🌧️", kicker: "Physical Geography",
            body: `<p>The <strong>water cycle</strong> describes how water moves between the land, oceans and atmosphere.</p>
              <ul><li><strong>Evaporation</strong> — the sun heats water, turning it into vapour</li><li><strong>Condensation</strong> — vapour cools and forms clouds</li><li><strong>Precipitation</strong> — rain, snow or hail falls</li><li><strong>Collection</strong> — water gathers in rivers, lakes and oceans</li></ul>
              <p>The cycle repeats again and again.</p>`,
            keyFact: "Evaporation, condensation, precipitation and collection are the four main stages of the water cycle.",
            quiz: [
              { q: "What is the process of water turning into vapour?", options: ["Evaporation", "Condensation", "Precipitation", "Collection"], answer: 0 },
              { q: "Clouds form during…", options: ["Condensation", "Evaporation", "Collection", "Precipitation"], answer: 0 },
              { q: "Rain falling is called…", options: ["Precipitation", "Evaporation", "Condensation", "Erosion"], answer: 0 }
            ]
          }
        ]
      }
    ]
  }
];

/* ============================================================
   FREE COURSES (with certificates & assessment forms)
   ============================================================ */
const COURSES = [
  {
    id: "course-digital", title: "Digital Literacy for Kids", emoji: "💻", color: "#2E9BFF",
    level: "All ages", duration: "4 weeks", lessonsCount: 6, cert: true,
    desc: "Learn to use computers, the internet safely, and basic typing skills.",
    modules: [
      { title: "What is a Computer?", emoji: "🖥️", body: "<p>A computer is a machine that helps us do work, learn and play. It has a screen, keyboard, mouse and a brain called the CPU. Computers are used in schools, offices, banks and homes all over Zimbabwe.</p>" },
      { title: "Using a Keyboard & Mouse", emoji: "⌨️", body: "<p>The keyboard is for typing letters and numbers. The mouse helps us point, click and move things on the screen. Practise typing your name and simple words every day to get faster.</p>" },
      { title: "Staying Safe Online", emoji: "🛡️", body: "<p>Never share your full name, address or passwords online. Do not talk to strangers on the internet. Always tell a trusted adult if something makes you feel uncomfortable. Use strong passwords with letters, numbers and symbols.</p>" },
      { title: "Using the Internet to Learn", emoji: "🌐", body: "<p>The internet connects computers around the world. You can use it to read, watch educational videos and do research for school. Always use trusted websites and give credit to your sources.</p>" },
      { title: "Files and Folders", emoji: "📁", body: "<p>A file is a document, picture or video saved on a computer. A folder keeps files organised. Give your files clear names so you can find them easily, like 'maths-homework-2025'.</p>" },
      { title: "Digital Citizenship", emoji: "🤝", body: "<p>Being a good digital citizen means being kind online, respecting others, not bullying, and using technology to help people. Think before you post or share anything.</p>" }
    ],
    assessment: [
      { q: "What part of the computer is called the 'brain'?", options: ["CPU", "Mouse", "Screen", "Keyboard"], answer: 0 },
      { q: "Which is a safe online habit?", options: ["Keeping passwords secret", "Sharing your address", "Talking to strangers", "Using '1234' as a password"], answer: 0 },
      { q: "A folder is used to…", options: ["Organise files", "Type letters", "Play games", "Print pages"], answer: 0 },
      { q: "Being a good digital citizen means…", options: ["Being kind online", "Bullying others", "Sharing fake news", "Hacking"], answer: 0 },
      { q: "The internet can be used to…", options: ["Learn and research", "Only play games", "Only watch movies", "Nothing useful"], answer: 0 },
      { q: "A strong password should have…", options: ["Letters, numbers and symbols", "Only your name", "Only numbers", "No characters"], answer: 0 },
      { q: "What should you do if something online makes you uncomfortable?", options: ["Tell a trusted adult", "Keep it secret", "Share it", "Ignore it forever"], answer: 0 },
      { q: "The mouse is used to…", options: ["Point and click", "Type words", "Print", "Store files"], answer: 0 },
      { q: "Good file names are…", options: ["Clear and descriptive", "Random letters", "Empty", "Always 'file1'"], answer: 0 },
      { q: "Digital citizenship includes…", options: ["Respecting others online", "Spreading rumours", "Stealing work", "Being rude"], answer: 0 }
    ]
  },
  {
    id: "course-coding", title: "Coding Basics with Blocks", emoji: "🧑‍💻", color: "#7C4DFF",
    level: "Ages 8+", duration: "5 weeks", lessonsCount: 5, cert: true,
    desc: "Think like a programmer using block coding, loops and logic.",
    modules: [
      { title: "What is Coding?", emoji: "🤖", body: "<p>Coding (programming) is giving instructions to a computer. Computers only do exactly what we tell them, step by step. A set of instructions is called an algorithm.</p>" },
      { title: "Sequencing", emoji: "🔢", body: "<p>Sequencing means putting instructions in the correct order. If the order is wrong, the program will not work. Think of a recipe — you must follow the steps in order!</p>" },
      { title: "Loops", emoji: "🔁", body: "<p>A loop repeats instructions. Instead of writing 'move forward' ten times, you write 'repeat 10 times: move forward'. Loops save time and make code shorter.</p>" },
      { title: "Conditionals (If...Then)", emoji: "🔀", body: "<p>Conditionals let a program make decisions. 'If it is raining, then take an umbrella.' This helps programs respond to different situations.</p>" },
      { title: "Debugging", emoji: "🐛", body: "<p>A bug is a mistake in a program. Debugging means finding and fixing bugs. Good programmers test their code often and fix problems step by step.</p>" }
    ],
    assessment: [
      { q: "A set of instructions for a computer is called an…", options: ["Algorithm", "Answer", "Abacus", "Angle"], answer: 0 },
      { q: "A loop is used to…", options: ["Repeat instructions", "Stop a program", "Delete code", "Print paper"], answer: 0 },
      { q: "Conditionals help a program to…", options: ["Make decisions", "Run faster", "Look pretty", "Save power"], answer: 0 },
      { q: "A bug is…", options: ["A mistake in a program", "A type of computer", "A game", "A robot"], answer: 0 },
      { q: "Sequencing means…", options: ["Putting steps in order", "Repeating steps", "Deleting steps", "Skipping steps"], answer: 0 },
      { q: "Computers do…", options: ["Exactly what they are told", "Whatever they want", "Nothing", "Only maths"], answer: 0 },
      { q: "Debugging means…", options: ["Fixing mistakes", "Adding bugs", "Deleting files", "Turning off"], answer: 0 },
      { q: "'Repeat 5 times: jump' is an example of a…", options: ["Loop", "Conditional", "Variable", "Function"], answer: 0 },
      { q: "'If hungry, then eat' is an example of a…", options: ["Conditional", "Loop", "Bug", "Sequence"], answer: 0 },
      { q: "Good programmers…", options: ["Test their code often", "Never check their work", "Avoid fixing bugs", "Give up easily"], answer: 0 }
    ]
  },
  {
    id: "course-money", title: "Financial Literacy for Young Zimbabweans", emoji: "💰", color: "#00A651",
    level: "Ages 10+", duration: "4 weeks", lessonsCount: 5, cert: true,
    desc: "Learn about money, saving, budgeting and smart spending.",
    modules: [
      { title: "What is Money?", emoji: "🪙", body: "<p>Money is what we use to buy goods and services. In Zimbabwe we use the Zimbabwe Gold (ZiG), US dollars and other currencies. Money makes trading easier than swapping goods.</p>" },
      { title: "Saving", emoji: "🏦", body: "<p>Saving means keeping money for later instead of spending it now. Even saving a small amount each week adds up. You can save in a piggy bank, a bank account or a savings group.</p>" },
      { title: "Budgeting", emoji: "📊", body: "<p>A budget is a plan for your money. List your income (money in) and your expenses (money out). A good budget helps you spend wisely and save for goals.</p>" },
      { title: "Needs vs Wants", emoji: "⚖️", body: "<p>Needs are things you must have to survive: food, water, shelter, school fees. Wants are things you would like but do not need: sweets, toys, games. Spend on needs first!</p>" },
      { title: "Entrepreneurship", emoji: "🚀", body: "<p>An entrepreneur starts a business to solve a problem and earn money. You can start small — selling vegetables, making crafts or offering services. Hard work, honesty and good customer care help a business grow.</p>" }
    ],
    assessment: [
      { q: "Money is used to…", options: ["Buy goods and services", "Only play", "Sleep", "Nothing"], answer: 0 },
      { q: "Saving means…", options: ["Keeping money for later", "Spending all now", "Losing money", "Borrowing"], answer: 0 },
      { q: "A budget is…", options: ["A plan for money", "A type of coin", "A bank", "A shop"], answer: 0 },
      { q: "Which is a NEED?", options: ["Food", "Sweets", "Toys", "Video games"], answer: 0 },
      { q: "Which is a WANT?", options: ["Video games", "Water", "Shelter", "School fees"], answer: 0 },
      { q: "An entrepreneur…", options: ["Starts a business", "Never works", "Only spends", "Hides money"], answer: 0 },
      { q: "In Zimbabwe, currency includes…", options: ["ZiG and US dollar", "Only euros", "Only yen", "No money"], answer: 0 },
      { q: "You should spend on needs…", options: ["First", "Last", "Never", "Only sometimes"], answer: 0 },
      { q: "Saving a little each week…", options: ["Adds up over time", "Wastes money", "Is useless", "Is illegal"], answer: 0 },
      { q: "Good customer care helps a business…", options: ["Grow", "Fail", "Close", "Lose money"], answer: 0 }
    ]
  },
  {
    id: "course-heritage", title: "Zimbabwe Heritage & Culture", emoji: "🇿🇼", color: "#FFB300",
    level: "All ages", duration: "3 weeks", lessonsCount: 5, cert: true,
    desc: "Discover the history, culture, languages and wonders of Zimbabwe.",
    modules: [
      { title: "The People of Zimbabwe", emoji: "👨‍👩‍👧‍👦", body: "<p>Zimbabwe is home to the Shona and Ndebele peoples, along with other groups like the Tonga, Venda, Kalanga, Nambya and Shangaan. Together we form one nation with many cultures and languages.</p>" },
      { title: "Great Zimbabwe & Monuments", emoji: "🏛️", body: "<p>Great Zimbabwe is a UNESCO World Heritage Site built by the Shona between the 11th and 15th centuries. Other monuments include the Matobo Hills and the Khami Ruins.</p>" },
      { title: "Music, Dance & Art", emoji: "🥁", body: "<p>Zimbabwean music includes mbira, marimba, and modern genres like sungura, chimurenga and Zimdancehall. Traditional dances include the Jerusarema and Mbakumba. Art and crafts like stone sculpture are famous worldwide.</p>" },
      { title: "Traditional Food", emoji: "🍲", body: "<p>Zimbabwean food includes sadza (made from maize meal), muriwo (vegetables), nyama (meat), mopane worms, and maheu (a traditional drink). Food brings families together.</p>" },
      { title: "National Symbols", emoji: "🦅", body: "<p>Our national symbols include the flag, the Zimbabwe Bird, the flame lily (national flower), and the national anthem 'Simudzai Mureza'. These symbols unite us as Zimbabweans.</p>" }
    ],
    assessment: [
      { q: "Zimbabwe's two largest ethnic groups are…", options: ["Shona and Ndebele", "Zulu and Xhosa", "Tonga and Venda", "English and French"], answer: 0 },
      { q: "Great Zimbabwe was built by the…", options: ["Shona", "British", "Portuguese", "Dutch"], answer: 0 },
      { q: "The mbira is a…", options: ["Musical instrument", "Food", "Animal", "Building"], answer: 0 },
      { q: "Sadza is made from…", options: ["Maize meal", "Wheat", "Rice", "Potatoes"], answer: 0 },
      { q: "Zimbabwe's national flower is the…", options: ["Flame lily", "Rose", "Lotus", "Tulip"], answer: 0 },
      { q: "The national anthem is called…", options: ["Simudzai Mureza", "Nkosi Sikelel", "God Bless Africa", "Rise Zimbabwe"], answer: 0 },
      { q: "Great Zimbabwe is a…", options: ["UNESCO World Heritage Site", "Museum", "School", "Market"], answer: 0 },
      { q: "Jerusarema is a traditional…", options: ["Dance", "Song", "Food", "Game"], answer: 0 },
      { q: "Zimbabwe's national bird is the…", options: ["Zimbabwe Bird", "Eagle", "Ostrich", "Flamingo"], answer: 0 },
      { q: "Maheu is a traditional…", options: ["Drink", "Dance", "Instrument", "Building"], answer: 0 }
    ]
  },
  {
    id: "course-environment", title: "Environmental Conservation", emoji: "🌳", color: "#00C2A8",
    level: "All ages", duration: "3 weeks", lessonsCount: 5, cert: true,
    desc: "Protect our planet — trees, water, wildlife and climate.",
    modules: [
      { title: "Why We Need Trees", emoji: "🌲", body: "<p>Trees give us oxygen, food, shade and medicine. They hold the soil together and bring rain. Cutting down too many trees (deforestation) causes soil erosion and drought. Plant a tree today!</p>" },
      { title: "Water Conservation", emoji: "💧", body: "<p>Clean water is precious, especially in dry seasons. Fix leaking taps, collect rainwater, and never waste water. Zimbabwe's rivers and dams supply water for drinking, farming and wildlife.</p>" },
      { title: "Wildlife Protection", emoji: "🦏", body: "<p>Zimbabwe's national parks protect elephants, lions, rhinos and many other animals. Poaching is illegal and harms our heritage. We must protect wildlife for future generations.</p>" },
      { title: "Waste Management", emoji: "♻️", body: "<p>Reduce, reuse and recycle! Do not litter. Separate rubbish into bins for paper, plastic and food. Litter pollutes our land and water and harms animals.</p>" },
      { title: "Climate Change", emoji: "🌍", body: "<p>Climate change causes hotter temperatures, droughts and floods. We can help by saving energy, planting trees, and using less plastic. Every small action counts.</p>" }
    ],
    assessment: [
      { q: "Trees give us…", options: ["Oxygen", "Plastic", "Metal", "Glass"], answer: 0 },
      { q: "Cutting down too many trees is called…", options: ["Deforestation", "Recycling", "Planting", "Irrigation"], answer: 0 },
      { q: "Which helps save water?", options: ["Fixing leaking taps", "Leaving taps open", "Wasting water", "Ignoring leaks"], answer: 0 },
      { q: "Poaching means…", options: ["Illegal hunting of animals", "Planting trees", "Saving water", "Recycling"], answer: 0 },
      { q: "The three Rs of waste are…", options: ["Reduce, Reuse, Recycle", "Run, Rest, Read", "Rain, River, Rock", "Red, Round, Rough"], answer: 0 },
      { q: "Climate change causes…", options: ["Droughts and floods", "Only rain", "No change", "Cooler weather always"], answer: 0 },
      { q: "We should protect wildlife because…", options: ["It is our heritage", "It is useless", "It is dangerous", "It is easy"], answer: 0 },
      { q: "Litter harms…", options: ["Animals and land", "Nothing", "Only cars", "Only buildings"], answer: 0 },
      { q: "Planting trees helps…", options: ["Bring rain and clean air", "Cause drought", "Pollute", "Nothing"], answer: 0 },
      { q: "To help the climate we can…", options: ["Save energy", "Waste energy", "Burn more", "Litter more"], answer: 0 }
    ]
  },
  {
    id: "course-health", title: "Health & Hygiene Heroes", emoji: "🦷", color: "#FF3D57",
    level: "All ages", duration: "3 weeks", lessonsCount: 5, cert: true,
    desc: "Build healthy habits for a strong body and mind.",
    modules: [
      { title: "Handwashing & Germs", emoji: "🧼", body: "<p>Germs are tiny living things that make us sick. Wash your hands with soap and clean water for at least 20 seconds, especially before eating and after using the toilet. This keeps you healthy.</p>" },
      { title: "Healthy Eating", emoji: "🥗", body: "<p>Eat a balanced diet with fruits, vegetables, grains, and proteins. Drink plenty of clean water. Limit sugary drinks and snacks. A healthy diet gives you energy to learn and play.</p>" },
      { title: "Exercise & Rest", emoji: "🏃", body: "<p>Exercise keeps your body strong and your mind sharp. Play sports, run, or dance every day. Sleep 8–10 hours each night so your body can rest and grow.</p>" },
      { title: "Dental Care", emoji: "🦷", body: "<p>Brush your teeth twice a day — morning and before bed — for two minutes. Avoid too many sweets. Visit a dentist regularly. Healthy teeth help you eat and smile.</p>" },
      { title: "Mental Wellbeing", emoji: "🧠", body: "<p>It is important to look after your feelings. Talk to someone you trust when you feel sad or worried. Be kind to others, take breaks, and do things you enjoy.</p>" }
    ],
    assessment: [
      { q: "Germs make us…", options: ["Sick", "Strong", "Tall", "Happy"], answer: 0 },
      { q: "How long should you wash your hands?", options: ["20 seconds", "1 second", "5 minutes", "Never"], answer: 0 },
      { q: "A balanced diet includes…", options: ["Fruits and vegetables", "Only sweets", "Only meat", "Only water"], answer: 0 },
      { q: "How much sleep do children need?", options: ["8–10 hours", "2 hours", "4 hours", "None"], answer: 0 },
      { q: "Brush your teeth…", options: ["Twice a day", "Once a week", "Never", "Once a month"], answer: 0 },
      { q: "Exercise keeps your body…", options: ["Strong", "Weak", "Tired always", "Sick"], answer: 0 },
      { q: "When you feel sad, you should…", options: ["Talk to someone you trust", "Keep it secret", "Shout", "Give up"], answer: 0 },
      { q: "Too many sweets can harm your…", options: ["Teeth", "Hair", "Eyes", "Nails"], answer: 0 },
      { q: "Drinking clean water is…", options: ["Healthy", "Bad", "Useless", "Dangerous"], answer: 0 },
      { q: "Being kind to others helps your…", options: ["Mental wellbeing", "Height", "Shoes", "Homework"], answer: 0 }
    ]
  },
  {
    id: "course-study", title: "Study Skills & Exam Success", emoji: "📖", color: "#2E9BFF",
    level: "Ages 12+", duration: "4 weeks", lessonsCount: 5, cert: true,
    desc: "Learn how to study smart, manage time and pass exams.",
    modules: [
      { title: "How We Learn", emoji: "🧠", body: "<p>We learn best when we read, write, say and do things. Repetition helps us remember. Reviewing work after 1 day, 1 week and 1 month helps move it into long-term memory.</p>" },
      { title: "Time Management", emoji: "⏰", body: "<p>Make a study timetable. Study in short blocks of 25–30 minutes with 5-minute breaks (the Pomodoro technique). Prioritise difficult subjects. Avoid distractions like social media while studying.</p>" },
      { title: "Note-Taking", emoji: "📝", body: "<p>Good notes help you revise. Use headings, bullet points, mind maps and colours. Summarise ideas in your own words. Keep notes neat and organised by subject.</p>" },
      { title: "Revision Techniques", emoji: "🔄", body: "<p>Revise actively — do past exam papers, test yourself, and explain topics to a friend. Do not just read. Practise answering questions under timed conditions.</p>" },
      { title: "Exam Day Tips", emoji: "✅", body: "<p>Sleep well the night before. Eat breakfast. Read all questions carefully. Answer easy questions first. Manage your time. Check your work before handing in. Stay calm and breathe.</p>" }
    ],
    assessment: [
      { q: "We learn best when we…", options: ["Read, write, say and do", "Only listen", "Only sleep", "Only watch TV"], answer: 0 },
      { q: "The Pomodoro technique uses study blocks of…", options: ["25–30 minutes", "5 hours", "1 minute", "All day"], answer: 0 },
      { q: "Good notes use…", options: ["Headings and bullets", "Random words", "No structure", "Only pictures"], answer: 0 },
      { q: "Active revision includes…", options: ["Doing past papers", "Only reading", "Sleeping", "Skipping"], answer: 0 },
      { q: "On exam day you should…", options: ["Read questions carefully", "Rush", "Skip questions", "Panic"], answer: 0 },
      { q: "Reviewing work after 1 day and 1 week helps…", options: ["Long-term memory", "Forgetting", "Nothing", "Tiredness"], answer: 0 },
      { q: "A study timetable helps with…", options: ["Time management", "Sleeping", "Eating", "Playing"], answer: 0 },
      { q: "Before an exam you should…", options: ["Sleep well", "Stay up all night", "Skip breakfast", "Panic"], answer: 0 },
      { q: "You should answer… questions first.", options: ["Easy", "Hardest", "Longest", "None"], answer: 0 },
      { q: "Explaining a topic to a friend helps you…", options: ["Understand it better", "Forget it", "Waste time", "Nothing"], answer: 0 }
    ]
  },
  {
    id: "course-art", title: "Creative Arts & Design", emoji: "🎨", color: "#FF8A00",
    level: "All ages", duration: "3 weeks", lessonsCount: 5, cert: true,
    desc: "Express yourself through drawing, colour and Zimbabwean craft.",
    modules: [
      { title: "Elements of Art", emoji: "🖌️", body: "<p>The elements of art are line, shape, colour, texture, form, space and value. These are the building blocks of every artwork.</p>" },
      { title: "Colour Theory", emoji: "🌈", body: "<p>Primary colours (red, blue, yellow) cannot be mixed from others. Mixing them creates secondary colours (green, orange, purple). Warm colours feel exciting; cool colours feel calm.</p>" },
      { title: "Drawing Techniques", emoji: "✏️", body: "<p>Start with light pencil lines, then add detail. Use shading to show light and shadow. Practise drawing what you see. Everyone can learn to draw with practice!</p>" },
      { title: "Zimbabwean Stone Sculpture", emoji: "🗿", body: "<p>Zimbabwe is famous for Shona stone sculpture, carved from soapstone and springstone. Artists like Nicholas Mukomberanwa made this art famous worldwide. It shows our culture and creativity.</p>" },
      { title: "Craft & Recycling Art", emoji: "♻️", body: "<p>You can make beautiful art from recycled materials — bottles, paper, fabric and wire. Create toys, jewellery or decorations. Art and craft can also become a business.</p>" }
    ],
    assessment: [
      { q: "The building blocks of art are called…", options: ["Elements of art", "Numbers", "Letters", "Rules"], answer: 0 },
      { q: "Which is a primary colour?", options: ["Red", "Green", "Orange", "Purple"], answer: 0 },
      { q: "Mixing blue and yellow makes…", options: ["Green", "Purple", "Orange", "Brown"], answer: 0 },
      { q: "Shading is used to show…", options: ["Light and shadow", "Words", "Numbers", "Music"], answer: 0 },
      { q: "Zimbabwe is famous for…", options: ["Stone sculpture", "Ice carving", "Glass blowing", "Sand castles"], answer: 0 },
      { q: "Warm colours feel…", options: ["Exciting", "Calm", "Sad", "Cold"], answer: 0 },
      { q: "You can make art from…", options: ["Recycled materials", "Only paint", "Only paper", "Nothing"], answer: 0 },
      { q: "A famous Zimbabwean sculptor is…", options: ["Nicholas Mukomberanwa", "Pablo Picasso", "Leonardo da Vinci", "Vincent van Gogh"], answer: 0 },
      { q: "Everyone can learn to draw with…", options: ["Practice", "Magic", "Money", "Luck"], answer: 0 },
      { q: "Art and craft can become a…", options: ["Business", "Problem", "Waste", "Mistake"], answer: 0 }
    ]
  }
];

/* ============================================================
   GAMES
   ============================================================ */
const GAMES = [
  { id: "game-memory", title: "Memory Match", emoji: "🧠", color: "#7C4DFF", desc: "Flip the cards and match the pairs. Train your memory!" },
  { id: "game-math", title: "Math Blitz", emoji: "⚡", color: "#2E9BFF", desc: "Answer maths questions as fast as you can!" }
];

/* ============================================================
   BADGES
   ============================================================ */
const BADGES = [
  { id: "first-step", name: "First Step", emoji: "👣", desc: "Complete your first lesson" },
  { id: "quiz-whiz", name: "Quiz Whiz", emoji: "🧠", desc: "Pass 5 quizzes" },
  { id: "perfect", name: "Perfect Score", emoji: "💯", desc: "Get 100% on a quiz" },
  { id: "explorer", name: "Explorer", emoji: "🧭", desc: "Try all 4 levels" },
  { id: "course-grad", name: "Course Graduate", emoji: "🎓", desc: "Finish a full course" },
  { id: "certified", name: "Certified", emoji: "🏅", desc: "Earn a certificate" },
  { id: "gamer", name: "Game Master", emoji: "🎮", desc: "Win a game" },
  { id: "streak", name: "On Fire", emoji: "🔥", desc: "Learn 3 days in a row" },
  { id: "shona-star", name: "Shona Star", emoji: "🇿🇼", desc: "Complete a Shona lesson" },
  { id: "science-ace", name: "Science Ace", emoji: "🔬", desc: "Complete a Science lesson" }
];

/* ============================================================
   BRAND
   ============================================================ */
const BRAND = {
  name: "Chiedza",
  full: "Chiedza Learning",
  tagline: "Lighting every child's future",
  founder: "Ntandomods",
  founderTitle: "Founder & CEO",
  country: "Zimbabwe",
  verifyRoute: "#/verify/"
};

/* ============================================================
   LEADERBOARD SEED
   Sample learners so the public board feels alive.
   ============================================================ */
const LEADERBOARD_SEED = [
  { name: "Tendai M.", avatar: "\ud83e\udd81", stars: 1240, lessons: 28, certs: 3 },
  { name: "Rudo C.", avatar: "\ud83c\udf1f", stars: 1120, lessons: 25, certs: 3 },
  { name: "Tapiwa N.", avatar: "\ud83d\ude80", stars: 980, lessons: 22, certs: 2 },
  { name: "Chipo M.", avatar: "\ud83d\udc18", stars: 870, lessons: 20, certs: 2 },
  { name: "Farai K.", avatar: "\ud83d\udc06", stars: 760, lessons: 18, certs: 2 },
  { name: "Nyasha D.", avatar: "\ud83d\udc12", stars: 690, lessons: 16, certs: 1 },
  { name: "Kudzai S.", avatar: "\ud83e\udd8f", stars: 610, lessons: 15, certs: 1 },
  { name: "Tatenda Z.", avatar: "\ud83d\udc13", stars: 540, lessons: 13, certs: 1 },
  { name: "Rutendo B.", avatar: "\ud83d\udc03", stars: 470, lessons: 11, certs: 1 },
  { name: "Simbarashe P.", avatar: "\ud83e\udd85", stars: 400, lessons: 10, certs: 0 },
  { name: "Vimbai T.", avatar: "\ud83c\udf1f", stars: 330, lessons: 8, certs: 0 },
  { name: "Munyaradzi G.", avatar: "\ud83d\ude80", stars: 260, lessons: 6, certs: 0 }
];

// Expose to window for non-module usage
window.LEVELS = LEVELS;
window.COURSES = COURSES;
window.GAMES = GAMES;
window.BADGES = BADGES;
window.BRAND = BRAND;
window.LEADERBOARD_SEED = LEADERBOARD_SEED;
