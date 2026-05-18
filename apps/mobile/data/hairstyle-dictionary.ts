export type HairstyleGender = "male" | "female" | "unisex";

export type HairstyleEntry = {
  id: string;
  name: string;
  localName?: string;
  description: string;
  suits: string;
  maintenanceLevel: "low" | "medium" | "high";
  gender: HairstyleGender;
  states: string[];
  tags: string[];
  searchQuery: string;
};

export const ALL_STATES = [
  "Kuala Lumpur",
  "Selangor",
  "Penang",
  "Johor",
  "Melaka",
  "Perak",
  "Kedah",
  "Kelantan",
  "Terengganu",
  "Pahang",
  "Negeri Sembilan",
  "Sabah",
  "Sarawak",
  "Perlis",
  "Putrajaya",
] as const;

export type MalaysianState = (typeof ALL_STATES)[number];

export const HAIRSTYLE_DICTIONARY: HairstyleEntry[] = [

  // ── MALE ──────────────────────────────────────────────────────────────────

  {
    id: "two-block",
    name: "Two-Block Cut",
    localName: "Two-Block",
    description:
      "Sides and back clipped very short while the top is left longer and styled freely. Hugely popular among Malaysian youth influenced by Korean and Japanese trends. Works great with straight or slightly wavy hair.",
    suits: "Oval, oblong, and heart face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka", "Perak", "Sabah", "Sarawak", "Putrajaya"],
    tags: ["korean", "trendy", "youth", "barbershop", "k-pop"],
    searchQuery: "two block haircut Malaysia men 2024",
  },
  {
    id: "edgar-cut",
    name: "Edgar Cut",
    description:
      "A blunt fringe cut straight across the forehead with tapered or faded sides. Very common at Malaysian barbershops especially in urban areas. Often paired with a skin fade for a sharper finish.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Putrajaya", "Melaka"],
    tags: ["fringe", "fade", "urban", "trendy", "blunt"],
    searchQuery: "edgar cut haircut Malaysia barbershop",
  },
  {
    id: "undercut-fade",
    name: "Undercut Fade",
    description:
      "Clean shaved or faded sides with a full top. A timeless barbershop staple across Malaysia — suits both office and casual settings. One of the most requested cuts nationwide.",
    suits: "Most face shapes, especially round and oval",
    maintenanceLevel: "medium",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["classic", "fade", "versatile", "office", "barbershop"],
    searchQuery: "undercut fade haircut Malaysia men",
  },
  {
    id: "high-fade",
    name: "High Fade",
    description:
      "Skin fade starting high on the sides for a sharp, clean contrast against the top. Popular at barbershops in KL and Selangor. Pairs well with any top style — curly, straight, or textured.",
    suits: "Oval, heart, and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Putrajaya", "Melaka", "Perak"],
    tags: ["fade", "sharp", "clean", "barbershop", "urban"],
    searchQuery: "high fade haircut Malaysia barbershop 2024",
  },
  {
    id: "low-fade",
    name: "Low Fade",
    description:
      "A subtle fade that starts just above the ears — cleaner than a natural taper but less dramatic than a high fade. Great for office environments and formal occasions.",
    suits: "All face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["fade", "subtle", "office", "formal", "clean"],
    searchQuery: "low fade haircut Malaysia men office",
  },
  {
    id: "burst-fade",
    name: "Burst Fade",
    description:
      "A semicircular fade that radiates around the ear, blending into the natural hairline at the back. Gaining rapid popularity at Malaysian barbershops for its unique and modern look.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka"],
    tags: ["fade", "unique", "modern", "barbershop"],
    searchQuery: "burst fade haircut Malaysia men",
  },
  {
    id: "crop-taper",
    name: "Crop Taper",
    description:
      "Short cropped top with tapered sides — extremely low maintenance and perfectly suited for Malaysia's hot and humid weather. A reliable everyday cut that never goes out of style.",
    suits: "All face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["low maintenance", "hot weather", "practical", "classic", "everyday"],
    searchQuery: "crop taper haircut Malaysia men",
  },
  {
    id: "textured-fringe",
    name: "Textured Fringe",
    description:
      "Layered textured top with a soft fringe swept forward or to the side. Popular among younger Malaysian men for a relaxed but stylish look. Works especially well with thicker Asian hair.",
    suits: "Oval, heart, and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka", "Perak", "Putrajaya"],
    tags: ["fringe", "textured", "casual", "youth", "korean"],
    searchQuery: "textured fringe haircut Malaysia men 2024",
  },
  {
    id: "slick-back",
    name: "Slick Back",
    description:
      "All hair combed back and held with pomade or wax for a polished formal look. A go-to style for Malaysian weddings, Hari Raya, and corporate events. Works best with medium to long hair.",
    suits: "Oval and oblong face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["formal", "raya", "wedding", "classic", "pomade"],
    searchQuery: "slick back hairstyle Malaysian men formal",
  },
  {
    id: "pompadour-fade",
    name: "Pompadour Fade",
    description:
      "Volume-heavy top swept back with faded sides — a bold statement cut popular at premium barbershops in KL and Penang. Requires pomade or wax to hold the signature height.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "high",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka"],
    tags: ["bold", "volume", "premium", "statement", "pomade"],
    searchQuery: "pompadour fade haircut Malaysia men",
  },
  {
    id: "buzz-cut",
    name: "Buzz Cut",
    description:
      "Uniform short clipper cut all over the head. The most practical cut for Malaysia's tropical heat and humidity — very popular in Sabah, Sarawak, and among military personnel.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["low maintenance", "hot weather", "practical", "military", "simple"],
    searchQuery: "buzz cut Malaysia men hot weather",
  },
  {
    id: "bald-shave",
    name: "Clean Bald Shave",
    localName: "Botak",
    description:
      "Fully shaved head with a smooth scalp. A confident and bold look gaining popularity across Malaysia — pairs exceptionally well with beard styling for a sharp overall appearance.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["bald", "botak", "confident", "beard", "bold"],
    searchQuery: "clean shaved bald head Malaysia men style",
  },
  {
    id: "traditional-side-part",
    name: "Traditional Side Part",
    localName: "Belah Tepi",
    description:
      "A classic side-parted style combed neatly with light pomade or water-based gel. Common among older generations and still widely popular in Kelantan, Terengganu, and smaller towns.",
    suits: "Oval and oblong face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ["Kelantan", "Terengganu", "Kedah", "Perlis", "Pahang", "Perak"],
    tags: ["traditional", "classic", "kampung", "formal", "heritage"],
    searchQuery: "traditional side part hairstyle Malaysia men",
  },
  {
    id: "mullet-fade",
    name: "Modern Mullet Fade",
    description:
      "A contemporary take on the mullet — short on the sides with a fade, longer textured top, and a defined longer section at the back. Growing in popularity at trend-forward barbershops in KL.",
    suits: "Oval and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor"],
    tags: ["mullet", "modern", "trendy", "edgy", "barbershop"],
    searchQuery: "modern mullet fade haircut Malaysia men 2024",
  },
  {
    id: "curly-taper",
    name: "Curly Taper",
    description:
      "Natural curls left on top with tapered or faded sides. Perfect for Malaysians with naturally curly or wavy hair — common among Indian Malaysian and mixed-heritage men.",
    suits: "Oval and round face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Perak", "Negeri Sembilan"],
    tags: ["curly", "natural", "taper", "texture", "Indian"],
    searchQuery: "curly taper haircut Malaysia men natural hair",
  },
  {
    id: "skin-fade-line-up",
    name: "Skin Fade with Line-Up",
    description:
      "A sharp skin fade paired with a crisp hairline lineup at the forehead and temples. The sharpest barbershop finish available — very popular in urban Malaysian barbershops.",
    suits: "Oval, square, and oblong face shapes",
    maintenanceLevel: "high",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Putrajaya", "Melaka"],
    tags: ["skin fade", "line-up", "sharp", "barbershop", "clean"],
    searchQuery: "skin fade line up haircut Malaysia barbershop",
  },

  // ── FEMALE ────────────────────────────────────────────────────────────────

  {
    id: "korean-bob",
    name: "Korean Bob",
    localName: "Bob Korea",
    description:
      "A chin-length bob with soft layers or blunt ends, often paired with subtle highlights or a middle part. Currently the most requested women's cut at Malaysian salons — works beautifully with straight Asian hair.",
    suits: "Oval, heart, and square face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka", "Putrajaya", "Perak"],
    tags: ["korean", "bob", "trendy", "salon", "k-beauty"],
    searchQuery: "korean bob haircut Malaysia women 2024",
  },
  {
    id: "rebonding-straight",
    name: "Rebonding Straight",
    localName: "Rebonding / Lurus",
    description:
      "Chemical straightening treatment that gives pin-straight, frizz-free hair. A Malaysian salon staple especially popular in humid coastal states. Results last 6–12 months with proper care.",
    suits: "All face shapes",
    maintenanceLevel: "low",
    gender: "female",
    states: ALL_STATES.slice(),
    tags: ["rebonding", "straight", "treatment", "anti-frizz", "salon"],
    searchQuery: "rebonding hair treatment Malaysia women salon",
  },
  {
    id: "layer-cut",
    name: "Layer Cut",
    localName: "Rambut Berlapis",
    description:
      "Multiple layers cut into the hair to add movement and volume. Extremely versatile — suits wavy and curly hair types common among Malay, Chinese, and Indian Malaysian women. Reduces bulk in thick hair.",
    suits: "Oval, round, and heart face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ALL_STATES.slice(),
    tags: ["layers", "volume", "movement", "versatile", "everyday"],
    searchQuery: "layer cut hairstyle Malaysia women",
  },
  {
    id: "wolf-cut",
    name: "Wolf Cut",
    description:
      "A shaggy layered cut with a wispy fringe and lots of texture inspired by 70s rock aesthetics. A trending style seen at KL and Penang boutique salons — works especially well with naturally wavy or frizzy hair.",
    suits: "Oval and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka"],
    tags: ["trendy", "shaggy", "textured", "boutique", "wavy"],
    searchQuery: "wolf cut hairstyle Malaysia women 2024",
  },
  {
    id: "butterfly-cut",
    name: "Butterfly Cut",
    description:
      "Face-framing layers that fan outward like butterfly wings, creating volume and movement. Embraces natural hair texture — ideal for Malaysia's humidity as it works with rather than against the hair's natural behaviour.",
    suits: "Oval and heart face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka", "Putrajaya"],
    tags: ["face-framing", "volume", "trendy", "natural", "layers"],
    searchQuery: "butterfly cut hairstyle Malaysia women",
  },
  {
    id: "curtain-bangs",
    name: "Curtain Bangs",
    localName: "Fringe Tirai",
    description:
      "Soft centre-parted bangs that frame the face symmetrically like curtains. Very popular among young Malaysian women influenced by Korean and Japanese beauty trends. Easy to grow out gracefully.",
    suits: "Oval, heart, and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Putrajaya", "Melaka", "Perak"],
    tags: ["bangs", "fringe", "korean", "face-framing", "soft"],
    searchQuery: "curtain bangs hairstyle Malaysia women 2024",
  },
  {
    id: "c-curl-blowdry",
    name: "C-Curl Blowdry",
    localName: "C-Curl / Blow",
    description:
      "Hair ends curled inward in a smooth C-shape using a blowdryer and round brush. A popular salon finish across all of Malaysia — delivers a polished, put-together look for daily wear or formal occasions.",
    suits: "All face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ALL_STATES.slice(),
    tags: ["blowdry", "salon finish", "polished", "everyday", "volume"],
    searchQuery: "c curl blowdry hairstyle Malaysia women salon",
  },
  {
    id: "wispy-fringe",
    name: "Wispy Fringe",
    localName: "Fringe Nipis",
    description:
      "Light, airy fringe cut to eyebrow length with feathered, wispy ends. Suits petite Malaysian women and pairs beautifully with long straight or wavy hair for a soft, feminine look.",
    suits: "Oval and heart face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Sabah", "Sarawak", "Melaka"],
    tags: ["fringe", "wispy", "feminine", "soft", "petite"],
    searchQuery: "wispy fringe hairstyle Malaysia women",
  },
  {
    id: "long-straight-natural",
    name: "Long Straight Natural",
    localName: "Rambut Panjang Lurus",
    description:
      "Long naturally straight or lightly treated hair worn down. A timeless and elegant look especially common among Sabahan, Sarawakian, and East Coast Malaysian women. Minimal styling required.",
    suits: "All face shapes",
    maintenanceLevel: "low",
    gender: "female",
    states: ["Sabah", "Sarawak", "Kelantan", "Terengganu", "Kedah", "Perlis", "Pahang"],
    tags: ["natural", "long", "traditional", "east malaysia", "minimal"],
    searchQuery: "long straight natural hair Malaysia women",
  },
  {
    id: "digital-perm",
    name: "Digital Perm",
    localName: "Perm Digital",
    description:
      "A digital perming treatment that creates soft, defined loose waves. Very popular in Malaysian Chinese communities and boutique salons in Penang, KL, and Ipoh. Waves look best when hair dries naturally.",
    suits: "Oval and round face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Perak", "Melaka"],
    tags: ["perm", "waves", "treatment", "chinese community", "boutique"],
    searchQuery: "digital perm wave hairstyle Malaysia women salon",
  },
  {
    id: "lob-cut",
    name: "Long Bob (Lob)",
    description:
      "A shoulder-length bob that offers the best of both worlds — the structure of a bob with the versatility of longer hair. Easily styled straight, wavy, or tucked behind the ears.",
    suits: "Oval, square, and round face shapes",
    maintenanceLevel: "low",
    gender: "female",
    states: ALL_STATES.slice(),
    tags: ["bob", "shoulder length", "versatile", "everyday", "classic"],
    searchQuery: "long bob lob haircut Malaysia women",
  },
  {
    id: "hime-cut",
    name: "Hime Cut",
    localName: "Potongan Puteri",
    description:
      "A Japanese-inspired style with straight blunt fringe, side curtains cut to cheekbone length, and long straight hair at the back. Gaining a dedicated following in Malaysia's anime and fashion communities.",
    suits: "Oval and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor"],
    tags: ["japanese", "anime", "princess", "blunt fringe", "unique"],
    searchQuery: "hime cut hairstyle Malaysia women japanese",
  },

  // ── UNISEX ────────────────────────────────────────────────────────────────

  {
    id: "pixie-cut",
    name: "Pixie Cut",
    description:
      "Very short all-round cut with slightly longer top and textured ends. Highly practical for Malaysia's tropical heat and growing in popularity especially in KL's creative and arts scene.",
    suits: "Oval and heart face shapes",
    maintenanceLevel: "low",
    gender: "unisex",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka"],
    tags: ["short", "practical", "creative", "bold", "minimal"],
    searchQuery: "pixie cut hairstyle Malaysia 2024",
  },
  {
    id: "afro-textured",
    name: "Natural Afro",
    description:
      "Embracing natural coily, kinky, or tight-curl hair texture without chemical treatment. A growing and celebrated movement in Malaysia, especially in Sabah, Sarawak, and among the African diaspora community in KL.",
    suits: "Oval and round face shapes",
    maintenanceLevel: "medium",
    gender: "unisex",
    states: ["Kuala Lumpur", "Selangor", "Sabah", "Sarawak", "Penang"],
    tags: ["natural", "coily", "afro", "texture", "curly"],
    searchQuery: "natural afro textured hair Malaysia styling",
  },
  {
    id: "undercut-long-top",
    name: "Undercut with Long Top",
    description:
      "Shaved or very short sides with a dramatically longer top that can be worn swept back, braided, or in a bun. Popular across genders in Malaysia's urban fashion scene.",
    suits: "Oval and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "unisex",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor"],
    tags: ["undercut", "long top", "fashion", "bun", "urban"],
    searchQuery: "undercut long top hairstyle Malaysia fashion",
  },
  {
    id: "shaggy-layers",
    name: "Shaggy Layers",
    description:
      "Choppy, uneven layers throughout the hair for a deliberately undone, effortless texture. Suits both wavy and straight hair — popular at indie and alternative salons across Malaysia.",
    suits: "Oval, oblong, and heart face shapes",
    maintenanceLevel: "low",
    gender: "unisex",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka"],
    tags: ["shaggy", "layers", "effortless", "indie", "textured"],
    searchQuery: "shaggy layers hairstyle Malaysia 2024",
  },
];
