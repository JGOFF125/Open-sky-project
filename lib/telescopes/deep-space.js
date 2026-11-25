export const deepSpaceImages = [
  {
    id: "webb-first-deep-field",
    name: "Webb’s First Deep Field",
    telescope: "James Webb · NIRCam",
    description:
      "Gravity from the galaxy cluster SMACS 0723 bends light from more distant galaxies into arcs.",
    alt: "A dense field of galaxies, bright stars, and curved orange arcs around the SMACS 0723 cluster",
    image: "https://cdn.esawebb.org/archives/images/screen/weic2209a.jpg",
    source: "https://esawebb.org/images/weic2209a/",
    credit: "NASA, ESA, CSA, and STScI",
    width: 1280,
    height: 1306,
  },
  {
    id: "hubble-extreme-deep-field",
    name: "Hubble eXtreme Deep Field",
    telescope: "Hubble · ACS and WFC3",
    description:
      "A decade of Hubble observations reveals about 5,500 galaxies in a tiny patch of the sky.",
    alt: "Thousands of galaxies of different shapes and colors in the dark Hubble eXtreme Deep Field",
    image: "https://cdn.esahubble.org/archives/images/screen/heic1214a.jpg",
    source: "https://esahubble.org/images/heic1214a/",
    credit:
      "NASA, ESA, G. Illingworth, D. Magee, and P. Oesch (University of California, Santa Cruz), R. Bouwens (Leiden University), and the HUDF09 Team",
    width: 1280,
    height: 1117,
  },
  {
    id: "webb-pillars-of-creation",
    name: "Pillars of Creation",
    telescope: "James Webb · NIRCam",
    description:
      "Webb’s infrared view exposes newly forming stars within the dusty pillars of the Eagle Nebula.",
    alt: "Towering brown pillars of dust and gas outlined against a star field in the Eagle Nebula",
    image: "https://cdn.esawebb.org/archives/images/screen/weic2216a.jpg",
    source: "https://esawebb.org/images/weic2216a/",
    credit:
      "NASA, ESA, CSA, STScI; J. DePasquale, A. Koekemoer, A. Pagan (STScI).",
    width: 1280,
    height: 1280,
  },
];

export const skyTargets = [
  { name: "Andromeda Galaxy", ra: "10.6847", dec: "41.2687", fov: "4" },
  { name: "Orion Nebula", ra: "83.8221", dec: "-5.3911", fov: "2" },
  { name: "Eagle Nebula", ra: "274.7306", dec: "-13.8067", fov: "1" },
];

export function skyAtlasUrl(index) {
  const { ra, dec, fov } = skyTargets[index];
  const url = new URL("https://aladin.cds.unistra.fr/AladinLite/");
  url.search = new URLSearchParams({
    ra,
    dec,
    fov,
    hips: "P/DSS2/color",
    theme: "dark",
  });
  return url.href;
}
