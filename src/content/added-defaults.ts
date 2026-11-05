/**
 * Photos and CVs added on 5 November 2026 at Asia's request. Kept apart from defaults.ts because the
 * content rules (src/lib/content.ts) also use them, to fill these in for pages she saved before they existed.
 */
type Img = { url: string; alt: string; focus: "center" | "top" };
const img = (file: string, alt: string): Img => ({ url: `/images/${file}`, alt, focus: "center" });

/** Show photos rotating at the top of the home page. */
export const HOME_PHOTOS: Img[] = [
  img("Borders_ArcolaTheatre -18.jpg", "Borders: Digital, Political, Emotional at the Arcola Theatre"),
  img("Richard-08.JPG", "Richard II, a promenade performance at Waterstones Gower Street"),
  img("WhereThereIsNoTime_TariqWestcarr_190326(15).jpg", "Where There Is No Time at Sevendials Playhouse"),
  img("IMG_5358.JPG", "No One’s Land at Etcetera Theatre Camden"),
  img("Borders_ArcolaTheatre -76.jpg", "Borders: Digital, Political, Emotional at the Arcola Theatre"),
  img("Richard-07.JPG", "Richard II at Waterstones Gower Street"),
  img("Borders_ArcolaTheatre -60.jpg", "Borders: Digital, Political, Emotional at the Arcola Theatre"),
  img("WhereThereIsNoTime_TariqWestcarr_190326(4).jpg", "Where There Is No Time at Sevendials Playhouse"),
  img("Richard-05.JPG", "Richard II at Waterstones Gower Street"),
  img("Tetr.jpg", "Juliusz Slowacki Theatre, Cracow"),
];

/** Her photo on the Contact page. */
export const CONTACT_PHOTO: Img = img("Profile 3.jpg", "Asia Joanna Rob");

/** The CV buttons on the Contact page. */
export const CVS: { label: string; url: string }[] = [
  { label: "Professional CV", url: "/cv/Asia-Joanna-Rob-Professional-CV.pdf" },
  { label: "Academic CV", url: "/cv/Asia-Joanna-Rob-Academic-CV.pdf" },
];
