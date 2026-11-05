/**
 * Blog posts (/blog/<slug>), built the same way as the PT with V guides.
 * The site shows these until Asia saves her own list in the dashboard; after that her list is used.
 *
 * The one post here is a template written by Sonny on 5 November 2026 from Asia's own bio, CVs and
 * production list. It is a DRAFT (published: false) and only goes live when Asia ticks
 * "Show on my website" after rewriting it in her own words.
 */
import type { SiteImage } from "@/lib/content";

export type PostBlock = { h2: string; p?: string[]; list?: string[]; image?: SiteImage };

export type Post = {
  /** The web address: /blog/<slug>. */
  slug: string;
  /** Drafts are only visible in the dashboard. */
  published: boolean;
  /** Shown above the heading, e.g. "November 2026". Optional. */
  date: string;
  h1: string;
  intro: string;
  /** Photo at the top. Optional. */
  image?: SiteImage;
  sections: PostBlock[];
  /** Optional quote shown after the sections. */
  quote?: { quote: string; name: string };
  /** Up to three other posts linked at the bottom. */
  related: string[];
  /** Shown on Google and when the link is shared. Empty means the heading and introduction are used. */
  title: string;
  description: string;
  /** Card text on the blog list. Empty means the start of the introduction. */
  summary: string;
};

export const posts: Post[] = [
  {
    slug: "hello-im-asia",
    published: false,
    date: "November 2026",
    h1: "Hello, I’m Asia",
    intro:
      "I’m Asia (pronounced Asha), a theatre director in training based in London. This is my first post, so I thought I would start with who I am, where I come from and what I care about in a rehearsal room.",
    image: { url: "/images/Profile 3.jpg", alt: "Asia Joanna Rob", focus: "center" },
    sections: [
      {
        h2: "Three theatre cultures",
        p: [
          "My work has grown out of three very different theatre worlds: Indian, Polish and British. I taught myself Hindi and moved to Mumbai, where I spent three years working as a dancer, an actress and a TV host. If you look up *Hasmukh* on Netflix or *Comedy Circus* on Sony TV, you might spot me.",
          "In Poland I studied South Asian Studies at the Jagiellonian University in Cracow, and in October 2026 I went back to assist on a new play by Agata Duda-Gracz at the Juliusz Slowacki Theatre, a national theatre that has been running since 1893.",
          "Moving between those worlds is where my passion for working with international actors, and with actors from underrepresented socioeconomic and ethnic backgrounds, comes from.",
        ],
      },
      {
        h2: "The work I make",
        p: [
          "I’m especially drawn to new writing, immersive and forum theatre, and stories about identity, belonging and the space between people. At the heart of it, I want to make work that moves people and puts human connection first.",
          "Some of the productions I’ve worked on this year:",
        ],
        list: [
          "*Noah* by Becky Harvey, as Director, at Arches Lane Theatre",
          "*Borders: Digital, Political, Emotional*, as Assistant Director, at the Arcola Theatre",
          "*Where There Is No Time* by Mohammedally Hashemi, as Assistant Director, at Sevendials Playhouse",
          "*Richard II*, adapted by Victoria Gartner, as Assistant Director, at Waterstones Gower Street",
          "*Black Mountain* by Brad Birch, as Assistant Director, at South London Theatre",
        ],
      },
      {
        h2: "The classroom and the rehearsal room",
        p: [
          "Alongside directing, I teach English for Academic Purposes, currently at University College London. Teaching shapes how I approach text and communication in a room, and it has made me think a lot about how power works in classrooms and rehearsals alike.",
          "My aim in both is the same: to create a safe space where actors, creatives and students can do their best work. One day I would like to explore this further in a PhD on decolonial practice and power dynamics in theatre.",
        ],
      },
      {
        h2: "What comes next",
        p: [
          "I’ve recently secured a place on the MFA Directing course at Birkbeck, University of London, and I’m building a career around new writing and collaborating with international artists in the UK and beyond.",
          "This blog is where I’ll share what I learn along the way: notes from rehearsal rooms, shows that stayed with me, and the questions I keep coming back to. If you’d like to work together, you’ll find my email on the Contact page.",
        ],
      },
    ],
    related: [],
    title: "",
    description: "",
    summary: "",
  },
];
