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
  "Labuan",
] as const;

export type MalaysianState = (typeof ALL_STATES)[number];

export const HAIRSTYLE_DICTIONARY: HairstyleEntry[] = [
  // ── MALE ──────────────────────────────────────────────────────────────────
  {
    id: "two-block",
    name: "Two-Block Cut",
    localName: "Two-Block",
    description:
      "Sides and back clipped very short while the top is left longer and styled freely. Hugely popular among Malaysian youth influenced by Korean trends.",
    suits: "Oval, oblong, and heart face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: [
      "Kuala Lumpur",
      "Selangor",
      "Penang",
      "Johor",
      "Melaka",
      "Perak",
      "Sabah",
      "Sarawak",
    ],
    tags: ["korean", "trendy", "youth", "barbershop"],
    searchQuery: "two block haircut Malaysia men 2024",
  },
  {
    id: "edgar-cut",
    name: "Edgar Cut",
    description:
      "A blunt fringe cut straight across the forehead with tapered or faded sides. Very common at Malaysian barbershops especially in urban areas.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: [
      "Kuala Lumpur",
      "Selangor",
      "Penang",
      "Johor",
      "Putrajaya",
    ],
    tags: ["fringe", "fade", "urban", "trendy"],
    searchQuery: "edgar cut haircut Malaysia barbershop",
  },
  {
    id: "undercut-fade",
    name: "Undercut Fade",
    description:
      "Clean shaved or faded sides with a full top. A timeless barbershop staple across Malaysia — suits office and casual looks.",
    suits: "Most face shapes, especially round and oval",
    maintenanceLevel: "medium",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["classic", "fade", "versatile", "office"],
    searchQuery: "undercut fade haircut Malaysia men",
  },
  {
    id: "high-fade",
    name: "High Fade",
    description:
      "Skin fade starting high up the sides for a sharp, clean contrast. Popular in KL and Selangor barbershops.",
    suits: "Oval, heart, and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Putrajaya"],
    tags: ["fade", "sharp", "clean", "barbershop"],
    searchQuery: "high fade haircut Malaysia barbershop 2024",
  },
  {
    id: "burst-fade",
    name: "Burst Fade",
    description:
      "A semicircular fade around the ear that blends into the natural hairline. Gaining popularity in Malaysian barbershops for its unique look.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor"],
    tags: ["fade", "unique", "modern"],
    searchQuery: "burst fade haircut Malaysia men",
  },
  {
    id: "crop-taper",
    name: "Crop Taper",
    description:
      "Short cropped top with tapered sides — low maintenance and suits Malaysia's hot weather perfectly.",
    suits: "All face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["low maintenance", "hot weather", "practical", "classic"],
    searchQuery: "crop taper haircut Malaysia men",
  },
  {
    id: "textured-fringe",
    name: "Textured Fringe",
    description:
      "Layered textured top with a soft fringe swept forward or to the side. Popular among younger Malaysian men for a casual stylish look.",
    suits: "Oval, heart, and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "male",
    states: [
      "Kuala Lumpur",
      "Selangor",
      "Penang",
      "Johor",
      "Melaka",
      "Perak",
    ],
    tags: ["fringe", "textured", "casual", "youth"],
    searchQuery: "textured fringe haircut Malaysia men 2024",
  },
  {
    id: "slick-back",
    name: "Slick Back",
    description:
      "All hair combed back and held with pomade or wax for a polished formal look. Popular for events, weddings, and Hari Raya.",
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
      "Volume on top swept back with faded sides — a bold statement cut popular at premium barbershops in KL and Penang.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "high",
    gender: "male",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor"],
    tags: ["bold", "volume", "premium", "statement"],
    searchQuery: "pompadour fade haircut Malaysia men",
  },
  {
    id: "buzz-cut",
    name: "Buzz Cut",
    description:
      "Uniform short clipper cut all over. Extremely practical for Malaysia's heat and humidity — very popular in Sabah and Sarawak.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["low maintenance", "hot weather", "practical", "military"],
    searchQuery: "buzz cut Malaysia men hot weather",
  },
  {
    id: "bald-shave",
    name: "Clean Bald Shave",
    localName: "Botak",
    description:
      "Fully shaved head with smooth scalp. A confident look gaining popularity in Malaysia — pairs well with beard styling.",
    suits: "Oval and square face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ALL_STATES.slice(),
    tags: ["bald", "botak", "confident", "beard"],
    searchQuery: "clean shaved bald head Malaysia men style",
  },
  {
    id: "kelantan-traditional",
    name: "Traditional Side Part",
    localName: "Belah Tepi",
    description:
      "A classic side-parted style combed neatly with light pomade. Common among older generations and still popular in Kelantan and Terengganu.",
    suits: "Oval and oblong face shapes",
    maintenanceLevel: "low",
    gender: "male",
    states: ["Kelantan", "Terengganu", "Kedah", "Perlis", "Pahang"],
    tags: ["traditional", "classic", "kampung", "formal"],
    searchQuery: "traditional side part hairstyle Malaysia men",
  },

  // ── FEMALE ────────────────────────────────────────────────────────────────
  {
    id: "korean-bob",
    name: "Korean Bob",
    localName: "Bob Korea",
    description:
      "A chin-length bob with soft layers or blunt ends, often with subtle highlights. The most requested women's cut at Malaysian salons right now.",
    suits: "Oval, heart, and square face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: [
      "Kuala Lumpur",
      "Selangor",
      "Penang",
      "Johor",
      "Melaka",
      "Putrajaya",
    ],
    tags: ["korean", "bob", "trendy", "salon"],
    searchQuery: "korean bob haircut Malaysia women 2024",
  },
  {
    id: "rebonding-straight",
    name: "Rebonding Straight",
    localName: "Rebonding / Lurus",
    description:
      "Chemical straightening treatment for pin-straight hair. A Malaysian salon staple — especially popular in humid states for frizz-free hair.",
    suits: "All face shapes",
    maintenanceLevel: "low",
    gender: "female",
    states: ALL_STATES.slice(),
    tags: ["rebonding", "straight", "salon treatment", "anti-frizz"],
    searchQuery: "rebonding hair treatment Malaysia women salon",
  },
  {
    id: "layer-cut",
    name: "Layer Cut",
    localName: "Rambut Berlapis",
    description:
      "Multiple layers cut into the hair for movement and volume. Suits wavy and curly hair types common among Malay, Chinese, and Indian Malaysian women.",
    suits: "Oval, round, and heart face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ALL_STATES.slice(),
    tags: ["layers", "volume", "movement", "versatile"],
    searchQuery: "layer cut hairstyle Malaysia women",
  },
  {
    id: "wolf-cut",
    name: "Wolf Cut",
    description:
      "Shaggy layered cut with a wispy fringe and lots of texture — a trending style seen at KL and Penang boutique salons.",
    suits: "Oval and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor"],
    tags: ["trendy", "shaggy", "textured", "boutique"],
    searchQuery: "wolf cut hairstyle Malaysia women 2024",
  },
  {
    id: "butterfly-cut",
    name: "Butterfly Cut",
    description:
      "Face-framing layers that fan out like butterfly wings — creates volume and suits Malaysia's humidity as it embraces natural movement.",
    suits: "Oval and heart face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Melaka"],
    tags: ["face-framing", "volume", "trendy", "natural"],
    searchQuery: "butterfly cut hairstyle Malaysia women",
  },
  {
    id: "curtain-bangs",
    name: "Curtain Bangs",
    localName: "Fringe Tirai",
    description:
      "Soft centre-parted bangs that frame the face like curtains. Very popular among young Malaysian women influenced by Korean and Japanese trends.",
    suits: "Oval, heart, and oblong face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: [
      "Kuala Lumpur",
      "Selangor",
      "Penang",
      "Johor",
      "Putrajaya",
      "Melaka",
    ],
    tags: ["bangs", "fringe", "korean", "face-framing"],
    searchQuery: "curtain bangs hairstyle Malaysia women 2024",
  },
  {
    id: "c-curl-blowdry",
    name: "C-Curl Blowdry",
    localName: "C-Curl / Blow",
    description:
      "Ends curled inward in a C-shape using a blowdryer and round brush. A popular salon finish across Malaysia for a polished everyday look.",
    suits: "All face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ALL_STATES.slice(),
    tags: ["blowdry", "salon finish", "polished", "everyday"],
    searchQuery: "c curl blowdry hairstyle Malaysia women salon",
  },
  {
    id: "wispy-fringe",
    name: "Wispy Fringe",
    localName: "Fringe Nipis",
    description:
      "Light, airy fringe cut to eyebrow length with feathered ends. Suits petite Malaysian women and pairs well with long straight hair.",
    suits: "Oval and heart face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: [
      "Kuala Lumpur",
      "Selangor",
      "Penang",
      "Johor",
      "Sabah",
      "Sarawak",
    ],
    tags: ["fringe", "wispy", "petite", "feminine"],
    searchQuery: "wispy fringe hairstyle Malaysia women",
  },
  {
    id: "long-straight-east-malaysia",
    name: "Long Straight Natural",
    localName: "Rambut Panjang Lurus",
    description:
      "Long naturally straight or lightly treated hair worn down. A timeless look especially common among Sabahan and Sarawakian women.",
    suits: "All face shapes",
    maintenanceLevel: "low",
    gender: "female",
    states: ["Sabah", "Sarawak", "Kelantan", "Terengganu", "Kedah", "Perlis"],
    tags: ["natural", "long", "traditional", "east malaysia"],
    searchQuery: "long straight natural hair Malaysia women",
  },
  {
    id: "permed-wave",
    name: "Digital Perm Wave",
    localName: "Perm Digital",
    description:
      "Digital perm for soft loose waves — very popular in Malaysian Chinese communities and boutique salons in Penang and KL.",
    suits: "Oval and round face shapes",
    maintenanceLevel: "medium",
    gender: "female",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Perak"],
    tags: ["perm", "waves", "salon treatment", "chinese community"],
    searchQuery: "digital perm wave hairstyle Malaysia women salon",
  },

  // ── UNISEX ────────────────────────────────────────────────────────────────
  {
    id: "pixie-cut",
    name: "Pixie Cut",
    description:
      "Very short all-round cut with slightly longer top. Practical for Malaysia's heat and growing in popularity especially in KL's creative scene.",
    suits: "Oval and heart face shapes",
    maintenanceLevel: "low",
    gender: "unisex",
    states: ["Kuala Lumpur", "Selangor", "Penang", "Johor"],
    tags: ["short", "practical", "creative", "bold"],
    searchQuery: "pixie cut hairstyle Malaysia 2024",
  },
  {
    id: "afro-textured",
    name: "Afro-Textured Natural",
    description:
      "Embracing natural coily or kinky hair texture without chemical treatment. Growing community in Malaysia especially in Sabah, Sarawak, and KL.",
    suits: "Oval and round face shapes",
    maintenanceLevel: "medium",
    gender: "unisex",
    states: ["Kuala Lumpur", "Selangor", "Sabah", "Sarawak"],
    tags: ["natural", "coily", "afro", "texture"],
    searchQuery: "natural afro textured hair Malaysia styling",
  },
];
