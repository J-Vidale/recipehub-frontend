// Flagging likely allergens from an ingredient list.
//
// The one rule this module is built around: it can say "this looks like
// it contains milk", and it must never say "this is dairy free". Those
// are not two sides of the same claim. A false positive makes someone
// skip a recipe they could have eaten; a false negative can put someone
// in hospital. So there is deliberately no isFreeFrom / isSafeFor export
// here, and there should never be one - absence of a flag means we did
// not detect it, which is not the same as it not being there.
//
// Recipe text also cannot describe how something was made. Shared
// equipment, "may contain" warnings, a stock cube's own sub-ingredients
// and brand reformulation are all invisible from a line like "1 tbsp soy
// sauce". Whatever this returns is a prompt to go and read the label,
// which is what the UI says next to it.

// Matched against the ingredient name with word boundaries.
//
// Two different mechanisms, and the difference matters. `exclusions` are
// removed from the text before the patterns run, which is what stops
// "almond milk" registering as dairy or "peanut butter" as a tree nut.
// `negations` disqualify the ingredient outright, for a label that says
// the allergen is absent - stripping "gluten-free" as a span would leave
// "flour" behind and match anyway.
const RULES = [
  {
    id: "gluten",
    label: "Cereals containing gluten",
    negations: [/\bgluten[- ]free\b/, /\bwheat[- ]free\b/],
    exclusions: [/\bbuckwheat\b/g, /\bcorn ?flour\b/g, /\brice flour\b/g],
    patterns: [
      /\bwheat\b/, /\bflour\b/, /\bbread\b/, /\bbreadcrumbs?\b/, /\bpasta\b/,
      /\bspaghetti\b/, /\bmacaroni\b/, /\bnoodles?\b/, /\bcouscous\b/,
      /\bbarley\b/, /\brye\b/, /\bsemolina\b/, /\bspelt\b/, /\bfarro\b/,
      /\bpastry\b/, /\bpuff pastry\b/, /\bfilo\b/, /\bphyllo\b/, /\bseitan\b/,
      /\bsoy sauce\b/, /\bbeer\b/, /\bstout\b/, /\bale\b/, /\bcake\b/, /\bbiscuits?\b/,
    ],
  },
  {
    id: "milk",
    label: "Milk",
    exclusions: [
      /\b(almond|soya?|oat|coconut|rice|hemp|cashew|peanut)\s+milk\b/g,
      /\bpeanut butter\b/g, /\balmond butter\b/g, /\bcashew butter\b/g,
      /\bcocoa butter\b/g, /\bshea butter\b/g, /\bbutter ?nut\b/g,
      /\bbuttermilk substitute\b/g,
    ],
    negations: [/\bdairy[- ]free\b/, /\bnon[- ]dairy\b/, /\bmilk[- ]free\b/],
    patterns: [
      /\bmilk\b/, /\bbutter\b/, /\bcheese\b/, /\bcream\b/, /\byogh?urt\b/,
      /\bghee\b/, /\bcustard\b/, /\bmascarpone\b/, /\bricotta\b/, /\bmozzarella\b/,
      /\bparmesan\b/, /\bcheddar\b/, /\bfeta\b/, /\bcr[eè]me fra[iî]che\b/,
      /\bcondensed milk\b/, /\bevaporated milk\b/, /\bbuttermilk\b/, /\bpaneer\b/,
    ],
  },
  {
    id: "eggs",
    label: "Eggs",
    negations: [/\begg ?-? ?free\b/],
    exclusions: [/\begg ?plant\b/g],
    patterns: [/\beggs?\b/, /\begg yolks?\b/, /\begg whites?\b/, /\bmayonnaise\b/, /\bmeringue\b/, /\baioli\b/],
  },
  {
    id: "peanuts",
    label: "Peanuts",
    exclusions: [],
    patterns: [/\bpeanuts?\b/, /\bpeanut butter\b/, /\bgroundnuts?\b/, /\bsatay\b/],
  },
  {
    id: "tree-nuts",
    label: "Nuts",
    // Coconut is treated as a tree nut by US labelling rules but not by
    // EU ones, and most people avoiding nuts eat it. Flagging it here
    // would cry wolf on a large share of recipes, so it is excluded and
    // called out separately below.
    negations: [/\bnut[- ]free\b/],
    exclusions: [/\bcoconut\b/g, /\bnutmeg\b/g, /\bwater ?chestnuts?\b/g, /\bbutter ?nut\b/g],
    patterns: [
      /\balmonds?\b/, /\bhazelnuts?\b/, /\bwalnuts?\b/, /\bcashews?\b/,
      /\bpecans?\b/, /\bpistachios?\b/, /\bmacadamias?\b/, /\bbrazil nuts?\b/,
      /\bpine nuts?\b/, /\bmarzipan\b/, /\bpraline\b/, /\bnuts?\b/, /\bnibbed\b/,
    ],
  },
  {
    id: "fish",
    label: "Fish",
    exclusions: [],
    patterns: [
      /\bfish\b/, /\bsalmon\b/, /\btuna\b/, /\bcod\b/, /\bhaddock\b/, /\banchov(?:y|ies)\b/,
      /\bsardines?\b/, /\bmackerel\b/, /\bseabass\b/, /\bsea bass\b/, /\btrout\b/,
      /\bplaice\b/, /\bhalibut\b/, /\bworcestershire\b/, /\bfish sauce\b/, /\bnam pla\b/,
    ],
  },
  {
    id: "crustaceans",
    label: "Crustaceans",
    exclusions: [],
    patterns: [/\bprawns?\b/, /\bshrimps?\b/, /\bcrab\b/, /\blobster\b/, /\bcrayfish\b/, /\blangoustines?\b/],
  },
  {
    id: "molluscs",
    label: "Molluscs",
    exclusions: [],
    patterns: [/\bmussels?\b/, /\bclams?\b/, /\boysters?\b/, /\bsquid\b/, /\bcalamari\b/, /\boctopus\b/, /\bscallops?\b/, /\bsnails?\b/],
  },
  {
    id: "soya",
    label: "Soya",
    exclusions: [],
    patterns: [/\bsoya?\b/, /\bsoy sauce\b/, /\btofu\b/, /\bedamame\b/, /\bmiso\b/, /\btempeh\b/, /\btamari\b/],
  },
  {
    id: "sesame",
    label: "Sesame",
    exclusions: [],
    patterns: [/\bsesame\b/, /\btahini\b/, /\bhalva\b/, /\bza'?atar\b/],
  },
  {
    id: "celery",
    label: "Celery",
    exclusions: [],
    patterns: [/\bcelery\b/, /\bceleriac\b/, /\bcelery salt\b/],
  },
  {
    id: "mustard",
    label: "Mustard",
    exclusions: [],
    patterns: [/\bmustard\b/, /\bdijon\b/, /\bwholegrain mustard\b/],
  },
  {
    id: "lupin",
    label: "Lupin",
    exclusions: [],
    patterns: [/\blupin\b/, /\blupini\b/],
  },
  {
    id: "sulphites",
    label: "Sulphites",
    exclusions: [],
    patterns: [/\bsulphites?\b/, /\bsulfites?\b/, /\bwine\b/, /\bdried apricots?\b/],
  },
];

// Called out on its own rather than folded into "Nuts": the two big
// labelling regimes disagree about it, so the honest thing is to name it
// and let the reader decide.
const COCONUT = { id: "coconut", label: "Coconut", patterns: [/\bcoconut\b/] };

const stripExclusions = (text, exclusions) =>
  exclusions.reduce((acc, pattern) => acc.replace(pattern, " "), text);

// Returns the allergens detected in a list of ingredient names, each with
// the ingredient that triggered it so the reader can check our work
// rather than take it on trust. An empty array means nothing matched,
// which the UI must not present as "free from".
export const detectAllergens = (ingredientNames) => {
  const names = (ingredientNames || [])
    .filter((n) => typeof n === "string" && n.trim())
    .map((n) => n.toLowerCase());
  if (names.length === 0) return [];

  const found = [];

  for (const rule of [...RULES, COCONUT]) {
    const matchedBy = [];
    for (const name of names) {
      // A free-from label disqualifies the whole ingredient for this
      // allergen. Stripping the phrase instead would leave the noun
      // behind, so "gluten-free flour" would still match /flour/ - which
      // is exactly the bug this replaced.
      if ((rule.negations || []).some((pattern) => pattern.test(name))) continue;

      const text = stripExclusions(name, rule.exclusions || []);
      if (rule.patterns.some((pattern) => pattern.test(text))) {
        matchedBy.push(name);
      }
    }
    if (matchedBy.length > 0) {
      found.push({ id: rule.id, label: rule.label, matchedBy: [...new Set(matchedBy)] });
    }
  }

  return found;
};
