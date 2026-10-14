/* New free course: Sign Language & Deaf Awareness (with assessment + certificate) */
COURSES.push({
  id: "course-sign", title: "Sign Language & Deaf Awareness", emoji: "🤟", color: "#FF3D57",
  level: "All ages", duration: "4 weeks", lessonsCount: 6, cert: true,
  desc: "Discover Zimbabwean Sign Language, Deaf culture and how to include everyone at school and in the community.",
  modules: [
    { title: "Hands, Faces and Bodies That Talk", emoji: "🤟", body: "<p>Sign languages are visual languages. Signers use their <strong>hands</strong>, <strong>face</strong> and <strong>body</strong> to share ideas. Zimbabwean Sign Language (ZSL) is the language of Zimbabwe's Deaf community and is recognised in the 2013 Constitution.</p>" },
    { title: "Five Building Blocks of a Sign", emoji: "🖐️", body: "<p>Every sign has a <strong>handshape</strong>, a <strong>location</strong>, a <strong>movement</strong>, a <strong>palm orientation</strong> and <strong>facial expression</strong>. Changing one of these can change the meaning completely.</p>" },
    { title: "Fingerspelling & Name Signs", emoji: "🔤", body: "<p>Fingerspelling uses a hand shape for each letter to spell names, places and new words. Learn the alphabet used in Zimbabwe from a ZSL teacher. Name signs are given by the Deaf community, so never invent one for a Deaf person.</p>" },
    { title: "Everyday Deaf Etiquette", emoji: "🙏", body: "<p>Get attention with a wave or a gentle tap. Keep eye contact, face the person, do not cover your mouth and do not shout. Be patient, and use writing, drawing or gestures if you do not yet know signs.</p>" },
    { title: "Interpreters & Inclusive Spaces", emoji: "🧑‍🏫", body: "<p>An interpreter helps Deaf and hearing people communicate. Speak to the Deaf person, not the interpreter. Inclusive schools use visual alerts, good lighting, captions on videos and seating that lets everyone see the teacher and interpreter.</p>" },
    { title: "Deaf Culture, Heroes and Careers", emoji: "🌍", body: "<p>Deaf people are teachers, artists, athletes, engineers and entrepreneurs. Different countries have different sign languages (ZSL, SASL, ASL, BSL). The International Day of Sign Languages is celebrated every year on 23 September.</p>" }
  ],
  assessment: [
    q("What does ZSL stand for?", "Zimbabwean Sign Language", "Zimbabwe School League", "Zero Sound Language", "Zambezi Safari Lodge"),
    q("Which law recognises sign language in Zimbabwe?", "The 2013 Constitution", "The Traffic Act", "A market bylaw", "None"),
    q("How do Deaf people mainly communicate in ZSL?", "With hands, face and body", "By shouting", "Only by writing", "By whistling"),
    q("Which is NOT a building block of a sign?", "Smell", "Handshape", "Movement", "Location"),
    q("What is fingerspelling?", "Spelling words with hand shapes", "Counting on toes", "A kind of dance", "A computer game"),
    q("Who gives a name sign to a person?", "The Deaf community", "Anyone who feels like it", "A shopkeeper", "A television"),
    q("To get a Deaf person's attention you should…", "Wave or tap their shoulder gently", "Throw something", "Shout loudly", "Pull their clothes"),
    q("When using an interpreter you speak to…", "The Deaf person", "The wall", "Only the interpreter", "The floor"),
    q("Is there one sign language used all over the world?", "No", "Yes", "Only in Europe", "Only online"),
    q("International Day of Sign Languages is on…", "23 September", "1 May", "25 December", "18 April")
  ]
});
