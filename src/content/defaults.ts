/**
 * The original website wording and photos, taken from the static site as it was on 2 November 2026.
 * The site shows these until Asia saves a section in her dashboard; after that her saved version is used.
 * Words between *asterisks* are shown in italics.
 */
import type { SiteContent } from "@/lib/content";
import { CONTACT_PHOTO, CVS, HOME_PHOTOS } from "./added-defaults";

const img = (file: string, alt: string, focus: "center" | "top" = "center") => ({ url: `/images/${file}`, alt, focus });

export const DEFAULT_CONTENT: SiteContent = {
  site: {
    name: "Asia Joanna Rob",
    seoTitle: "Asia Joanna Rob — Theatre Director",
    // The original site has no Google description. Left empty until Asia writes or approves one.
    seoDescription: "",
    footer: "© 2026 Asia Joanna Rob. All rights reserved.",
  },

  about: {
    name: "Asia Joanna Rob",
    subtitle: "Theatre Director",
    photos: HOME_PHOTOS,
    portrait: img("Profile 3.jpg", "Asia Joanna Rob"),
    bio: [
      "Hi! I’m Asia (pronounced Asha), a theatre director in training with multiple professional credits as an Assistant Director. I’ve recently secured a place on the MFA Directing course at Birkbeck, University of London, and I’m working towards building a career around new writing and collaborating with international artists in the UK and beyond.",
      "I’ve trained and worked in the UK, India, and Poland, and it has really shaped how I view storytelling and creative collaboration. It is also where my passion for working with international actors and actors from underrepresented socioeconomic and ethnic backgrounds comes from. I’m especially interested in new writing, immersive and forum theatre, and stories about identity, belonging, and the space between people. At the heart of it, I want to make work that moves and puts the human connection first.",
      "Alongside directing, I’ve got a background in English teaching, which definitely feeds into how I approach text and communication in a room. I am very passionate about language and creating safe environments and continue to educate myself on how power dynamics shape the rehearsal process and classrooms. My mission is to continue to create safe environments for actors, creatives and my students to flourish and do their best work.",
      "Fun facts about me: I taught myself Hindi and moved to India for 3 years because of Shah Rukh Khan. I worked as a dancer, actress and a TV host. Just google *Hasmukh* on Netflix or *Comedy Circus* on Sony TV!",
    ].join("\n\n"),
    testimonials: [
      {
        quote:
          "Asia is a delight to work with. She always brings positive energy to any task she takes on, and she will take on any task necessary—no task too big or too small. She is superbly organised—way more than most people I’ve worked with in theatre and elsewhere over 3 decades. I came to rely on her—trusting her to observe and propose what needs to be doing, not just deliver what she has been given. Once you work with her, you’d want to find other opportunities to work with her again. That’s what I am doing!",
        name: "Ece Ozdemiroglu",
        role: "Founder of Meteatra · *Borders* at the Arcola Theatre",
      },
      {
        quote:
          "During our work together, Asia felt less like an assistant director and more like a creative partner in crime. I would love to work with her again. She’s incredibly organised, sharp, and able to spot issues before they become problems and put things in place early. Communication with her was always easy and clear. Her energy and commitment motivated the cast and lifted the whole process.",
        name: "Secil Honeywill",
        role: "Director of *Borders: Digital, Political, Emotional* at the Arcola Theatre",
      },
      {
        quote:
          "Asia is a committed, versatile, attentive and creative assistant director. It is an absolute joy to work with her—she is always aware of the needs of the room, and brings her eye for detail as well as her craft and enthusiasm to any project. I look forward to working with her again… and see what she creates next!",
        name: "Victoria Gartner",
        role: "Award-winning director of *Richard II* and founder of Will&Co",
      },
      {
        quote:
          "Asia’s work on *Where There Is No Time* was invaluable. Her commitment to the process is a testament to her passion and skill as an artist. As assistant director her input was well placed and thought through. She was organised, personable and forward thinking—solving problems before they arose time and time again.",
        name: "Hamza Ali",
        role: "Movement Director and Director of *Where There is No Time* at Sevendials Playhouse",
      },
    ],
  },

  productions: {
    heading: "Directing",
    items: [
      {
        title: "Untitled play",
        meta: "Assistant Director · Juliusz Slowacki Theatre, Poland · October 2026",
        description:
          "By award-winning writer and director Agata Duda-Gracz. The Juliusz Slowacki Theatre is a National Theatre with 540 seats, operating continuously since 1893.",
        images: [
          img("Tetr.jpg", "Juliusz Slowacki Theatre — interior"),
          img("slowacki-theatre-krakow-exterior.jpg", "Juliusz Slowacki Theatre — exterior"),
        ],
      },
      {
        title: "Black Mountain",
        meta: "Assistant Director & Photographer · South London Theatre · 21–25 April 2026",
        description: "Written by Brad Birch. Originally performed at the Orange Tree Theatre. Directed by Kurban Kassam.",
        images: [
          img("black mountain - show poster.jpeg", "Black Mountain poster"),
          ...["2", "0", "3", "4", "1", "6", "5"].map((n) => img(`Black Mountain${n}.png`, "Black Mountain — production still")),
        ],
      },
      {
        title: "Noah",
        meta: "Director · Arches Lane Theatre · 26 April 2026",
        description: "Written by Becky Harvey as part of the Sunday Fix Barons Court Theatre scratch night.",
        images: [img("Noah - Director.png", "Noah — Arches Lane Theatre")],
      },
      {
        title: "Richard II",
        meta: "Assistant Director & Photographer · Waterstones Gower Street · 13–14 April 2026",
        description:
          "Written by William Shakespeare, adapted by Victoria Gartner—award-winning director, writer and founder of Will&Co and Bard in the Bookshop. An hour-long promenade through Europe’s largest bookshop immersing the audience in the essence of a Shakespeare play.",
        images: ["01", "02", "03", "04", "05", "06", "07", "08", "09"].map((n) =>
          img(`Richard-${n}.JPG`, "Richard II — Waterstones Gower Street"),
        ),
      },
      {
        title: "Where There Is No Time",
        meta: "Assistant Director · Sevendials Playhouse, Covent Garden · 17–28 March 2026",
        description: "Written by Mohammedally Hashemi. Directed by Hamza Ali.",
        images: [
          img("WhereThereIsNoTime_TariqWestcarr_190326(3).jpg", "Where There Is No Time — costume scene"),
          img("WhereThereIsNoTime_TariqWestcarr_190326(4).jpg", "Where There Is No Time — dialogue"),
          img("WhereThereIsNoTime_TariqWestcarr_190326(11).jpg", "Where There Is No Time — intimate moment"),
          img("WhereThereIsNoTime_TariqWestcarr_190326(15).jpg", "Where There Is No Time — design studio"),
          img("DCS07452.jpg", "Where There Is No Time — cast"),
        ],
      },
      {
        title: "Borders: Digital, Political, Emotional",
        meta: "Assistant Director & Marketing Manager · Arcola Theatre · 11–14 Feb 2026",
        description:
          "With plays by competition winners Aine King, Andrew Lawston, Banu Şenel, Salman Siddiqi, Erdoğan Soytürk, and Tamara von Werthern. Fully sold-out run. Directed by Secil Honeywill.",
        images: (
          [
            ["16", "life jacket scene"],
            ["18", "physical theatre"],
            ["23", "solo monologue"],
            ["35", "two men"],
            ["60", "confrontation"],
            ["77", "kitchen scene"],
            ["84", "champagne"],
            ["86", "blue light"],
            ["76", "embrace"],
            ["103", "group"],
            ["31", "ensemble"],
            ["45", "binoculars"],
          ] as const
        ).map(([n, what]) => img(`Borders_ArcolaTheatre -${n}.jpg`, `Borders — ${what}`)),
      },
      {
        title: "No One’s Land",
        meta: "Marketing Officer, Ops & Photographer · Etcetera Theatre Camden · 15 March 2026",
        description:
          "Forum Theatre. Sold-out performance as part of the Women Writers Festival, sponsored by Arts Council England. Facilitated by Mengü Türk.",
        images: (
          [
            ["5358", "wide stage shot"],
            ["5364", "close-up discussion"],
            ["5390", "portrait"],
            ["5395", "dramatic moment"],
            ["5404", "two performers"],
            ["5408", "three at table"],
            ["5371", "close-up"],
          ] as const
        ).map(([n, what]) => img(`IMG_${n}.JPG`, `No One’s Land — ${what}`)),
      },
      {
        title: "Telling Tinder Tales",
        meta: "Marketing Officer · October 2025–April 2026",
        description: "Live shows at Leicester Comedy Festival, Glasgow Comedy Festival, and An Táin Arts Centre in Ireland.",
        images: [
          img("TTT x2.png", "Telling Tinder Tales — Glasgow Comedy Festival", "top"),
          img("TTT x1.jpg", "Telling Tinder Tales — Leicester Comedy Festival", "top"),
          img("Bez nazwy (Post na Instagram (45)).png", "Telling Tinder Tales — Leicester Comedy Festival poster", "top"),
        ],
      },
    ],
  },

  teaching: {
    heading: "Education",
    photos: [
      img("Teaching.jpg", "Teaching"),
      img("IMG-20251018-WA0005.jpg", "Group workshop"),
      img("Teaching 1.jpg", "Teaching"),
      img("IMG-20251018-WA0019.jpg", "Workshop participants"),
      img("20241011_152235.jpg", "Class group photo"),
      img("Teaching 2.jpg", "Teaching"),
      img("thumbnail_IMG_5886.jpg", "Group photo"),
      img("Teaching 4.JPG", "Teaching"),
      img("thumbnail_IMG_4681.jpg", "Class group photo"),
    ],
    intro: [
      "Alongside her work in theatre, Asia has built a strong teaching practice in English for Academic Purposes (EAP) and English as a Second Language (ESL), working with institutions including University College London, University of Manchester, University of Arts London and others in the UK and Spain. She continues to be inspired by her work with international students and language development, and expands her pedagogical portfolio to include teaching critical thinking and language through drama.",
      "She has contributed to syllabus development adopted at institutional level and hopes to combine her classroom and directing experience into starting a PhD on decolonial practices and power dynamics in theatre.",
    ].join("\n\n"),
    experienceHeading: "Experience",
    experience: [
      { title: "University of Arts, London", meta: "Guest lecturer - 2025" },
      { title: "University College London", meta: "Associate Lecturer in English for Academic Purposes · 2025–Present" },
      { title: "Kaplan International College London & Kaplan 30+", meta: "Sessional ESL / EAP Tutor · 2025–Present" },
      { title: "University of Manchester", meta: "Pre-sessional EAP Tutor · 2024" },
      { title: "EF Education First", meta: "ESL Teacher & IELTS Tutor · Manchester, Cambridge, London · 2023–2024" },
      { title: "English City, Valencia", meta: "ESL Teacher & Cambridge Exam Tutor · 2023" },
    ],
  },

  contact: {
    heading: "Contact",
    text: "Say hello! I’m looking to connect with theatre makers and educators from around the world.",
    email: "iamjoannarob@gmail.com",
    photo: CONTACT_PHOTO,
    cvs: CVS,
    links: [
      { label: "Instagram", url: "https://www.instagram.com/iamjoannarob/" },
      { label: "LinkedIn", url: "https://www.linkedin.com/in/joannarob/" },
    ],
  },
};
