/** @format */

const CATEGORY_MATCHERS = [
  {
    category: "sidewalk",
    pattern: /\b(sidewalk|footway|pathway|pedestrian path|shared-use path)\b/i,
  },
  { category: "curb", pattern: /\b(curb|kerb|curb ramp|ramp)\b/i },
  { category: "crossing", pattern: /\b(crossing|crosswalk)\b/i },
  {
    category: "road",
    pattern: /\b(road|street|highway|avenue|boulevard|lane)\b/i,
  },
  { category: "stairs", pattern: /\b(stairs|steps|staircase|stairway)\b/i },
  { category: "bus_stop", pattern: /\b(bus.?stop|transit.?stop)\b/i },
  { category: "entrance", pattern: /\b(entrance|entry|door|access.?point)\b/i },
  { category: "elevator", pattern: /\b(elevator|lift)\b/i },
  { category: "bench", pattern: /\b(bench|seat|seating)\b/i },
];

export function inferElementCategories(elementType) {
  const normalized = String(elementType ?? "").trim();
  const categories = new Set();

  if (!normalized) {
    return categories;
  }

  CATEGORY_MATCHERS.forEach(({ category, pattern }) => {
    if (pattern.test(normalized)) {
      categories.add(category);
    }
  });

  if (categories.has("crossing") && categories.has("signal")) {
    categories.add("signalized-crossing");
  }

  return categories;
}

export const elementPresetLibrary = [
  {
    id: "sidewalk",
    label: "Sidewalk",
    element_type: "Sidewalk",
    element_type_icon: "sidewalk",
    quest_query: "ways with (footway=sidewalk)",
  },
  {
    id: "curb-ramp",
    label: "Curb Ramp",
    element_type: "Curb Ramp",
    element_type_icon: "kerb_type",
    quest_query: "nodes with (barrier=kerb)",
  },
  {
    id: "pedestrian-crossing",
    label: "Pedestrian Crossing",
    element_type: "Pedestrian Crossing",
    element_type_icon: "pedestrian_crossing",
    quest_query: "ways with (footway=crossing)",
  },
  {
    id: "road",
    label: "Road",
    element_type: "Road",
    element_type_icon: "traffic_lights",
    quest_query:
      "ways with (highway=residential or highway=primary or highway=secondary or highway=tertiary or highway=unclassified or highway=living_street)",
  },
  {
    id: "stairs",
    label: "Stairs",
    element_type: "Stairs",
    element_type_icon: "steps",
    quest_query: "ways with (highway=steps)",
  },
  {
    id: "bus-stop",
    label: "Bus Stop",
    element_type: "Bus Stop",
    element_type_icon: "bus",
    quest_query: "nodes with (ext:highway=bus_stop)",
  },
  {
    id: "entrance",
    label: "Entrance",
    element_type: "Entrance",
    element_type_icon: "door",
    quest_query: "nodes with (ext:entrance=yes)",
  },
  {
    id: "elevator",
    label: "Elevator",
    element_type: "Elevator",
    element_type_icon: "building_levels",
    quest_query: "nodes with (ext:highway=elevator)",
  },
  {
    id: "bench",
    label: "Bench",
    element_type: "Bench",
    element_type_icon: "bench_poi",
    quest_query: "nodes with (amenity=bench)",
  },
];

export const questPresetLibrary = [
  {
    id: "sidewalk-surface-basics",
    label: "Sidewalk Surface",
    description:
      "Adds a surface type question plus an Other follow-up description.",
    elementCategories: ["sidewalk"],
    quests: [
      {
        template_quest_id: "surface-type",
        quest_title: "What is this sidewalk's surface type?",
        quest_description:
          "Choose the primary surface material of the sidewalk.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:surface",
        quest_answer_choices: [
          {
            value: "asphalt",
            choice_text: "Asphalt",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/sidewalk/surface/asphalt_landscape.png",
          },
          {
            value: "concrete",
            choice_text: "Concrete",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/sidewalk/surface/concrete_landscape.png",
          },
          {
            value: "paving_stones",
            choice_text: "Brick",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/sidewalk/surface/brick_landscape.png",
          },
          {
            value: "gravel",
            choice_text: "Gravel",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/sidewalk/surface/compacted_gravel_landscape.png",
          },
        ],
      },
      {
        template_quest_id: "surface-description",
        quest_title: "Please describe this sidewalk's surface material.",
        quest_description:
          "Enter a brief description of this sidewalk's surface material.",
        quest_type: "TextEntry",
        quest_tag: "ext:surface:description",
        quest_image_url:
          "https://provisodevstorage.blob.core.windows.net/projects/gig-element-icons/icons2/sidewalk_surface.png",
        quest_answer_dependency: {
          question_id: "surface-type",
          required_value: "other",
        },
      },
    ],
  },
  {
    id: "curb-basics",
    label: "Curb Type and Tactile Paving",
    description: "Adds curb type, tactile paving, and curb height questions.",
    elementCategories: ["curb"],
    quests: [
      {
        template_quest_id: "curb-type",
        quest_title: "What type of curb is this?",
        quest_description: "Identify the type of curb here.",
        quest_type: "ExclusiveChoice",
        quest_tag: "kerb",
        quest_answer_choices: [
          {
            value: "raised",
            choice_text: "Raised",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/kerb/raised_landscape.png",
          },
          {
            value: "lowered",
            choice_text: "Ramp",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/kerb/lowered_landscape.png",
          },
          {
            value: "flush",
            choice_text: "Flush",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/kerb/flush_landscape.png",
          },
        ],
      },
      {
        template_quest_id: "tactile-paving",
        quest_title: "Does this curb have tactile paving?",
        quest_description: "Check if this curb ramp has tactile paving.",
        quest_type: "ExclusiveChoice",
        quest_tag: "tactile_paving",
        quest_answer_choices: [
          {
            value: "no",
            choice_text: "No",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/kerb/tactile_paving/no_2_square.png",
          },
          {
            value: "yes",
            choice_text: "Yes",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/kerb/tactile_paving/yes_square.png",
          },
        ],
      },
      {
        template_quest_id: "curb-height",
        quest_title: "What is the height of this curb, in inches?",
        quest_description: "Specify the height of this curb, in inches.",
        quest_type: "Numeric",
        quest_tag: "height",
        quest_answer_dependency: {
          question_id: "curb-type",
          required_value: "raised",
        },
        quest_answer_validation: {
          min: 0,
          max: 12,
        },
      },
    ],
  },
  {
    id: "crossing-markings",
    label: "Crossing Markings",
    description:
      "Adds a question for roadway markings at a pedestrian crossing.",
    elementCategories: ["crossing", "signalized-crossing"],
    quests: [
      {
        template_quest_id: "crossing-markings",
        quest_title: "Does this crossing have markings on the roadway?",
        quest_description:
          "Check if there are roadway markings present at this crossing.",
        quest_type: "ExclusiveChoice",
        quest_tag: "crossing:markings",
        quest_answer_choices: [
          {
            value: "no",
            choice_text: "No markings",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/crossing/markings/no_square.png",
          },
          {
            value: "zebra",
            choice_text: "Marked crossing",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/crossing/markings/zebra_square.png",
          },
        ],
      },
    ],
  },
  {
    id: "signal-accessibility",
    label: "Signal Accessibility",
    description:
      "Adds pedestrian signal and accessible feature questions for crossings.",
    elementCategories: ["signal", "signalized-crossing"],
    quests: [
      {
        template_quest_id: "ped-signal",
        quest_title: "Does this crossing have signals for pedestrians?",
        quest_description:
          "Indicate whether this crossing has pedestrian signals.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:crossing:signals",
        quest_answer_choices: [
          {
            value: "no",
            choice_text: "No",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/crossing/markings/no_2_square.png",
          },
          {
            value: "yes",
            choice_text: "Yes",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/crossing/signals/arrow/yes_square.png",
          },
        ],
      },
      {
        template_quest_id: "ped-signal-features",
        quest_title:
          "What accessibility features are present at this signalized crossing?",
        quest_description:
          "Select all accessibility features present at this signalized crossing.",
        quest_type: "MultipleChoice",
        quest_tag: "ext:crossing:signals:features",
        quest_answer_dependency: {
          question_id: "ped-signal",
          required_value: "yes",
        },
        quest_answer_choices: [
          {
            value: "button",
            choice_text: "Button",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/crossing/signals/arrow/yes_square.png",
          },
          {
            value: "arrow",
            choice_text: "Tactile Arrow",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/crossing/signals/arrow/yes_square.png",
          },
          {
            value: "sound",
            choice_text: "Sound",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/crossing/signals/sound/yes_square.png",
          },
          {
            value: "vibration",
            choice_text: "Tactile Vibration",
            image_url:
              "https://raw.githubusercontent.com/TaskarCenterAtUW/tdei-tools/main/images/crossing/signals/vibration/yes_square.png",
          },
        ],
      },
    ],
  },
  {
    id: "sidewalk-width",
    label: "Sidewalk Width",
    description: "Adds a width measurement question for the sidewalk.",
    elementCategories: ["sidewalk"],
    quests: [
      {
        template_quest_id: "sidewalk-width",
        quest_title: "How wide is this sidewalk? (meters)",
        quest_description:
          "Measure or estimate the clear, usable width of this sidewalk in meters. The minimum accessible width is 1.5 m (≈ 5 ft).",
        quest_type: "Numeric",
        quest_tag: "width",
        quest_answer_validation: {
          min: 0,
          max: 20,
        },
      },
    ],
  },
  {
    id: "sidewalk-condition",
    label: "Sidewalk Condition and Obstructions",
    description:
      "Adds surface condition, cross-slope, obstruction, and buffer questions for the sidewalk.",
    elementCategories: ["sidewalk"],
    quests: [
      {
        template_quest_id: "surface-condition",
        quest_title: "Is the surface of this sidewalk in good condition?",
        quest_description:
          "Assess the overall condition of the surface — look for cracks, heaving, uneven sections, or other damage.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:surface_condition",
        quest_answer_choices: [
          { value: "good", choice_text: "Good — smooth and intact" },
          { value: "fair", choice_text: "Fair — minor damage, mostly usable" },
          {
            value: "poor",
            choice_text: "Poor — significant damage or hazards",
          },
        ],
      },
      {
        template_quest_id: "cross-slope",
        quest_title: "Is there a noticeable cross-slope on this sidewalk?",
        quest_description:
          "Cross-slope is the tilt of the sidewalk perpendicular to the direction of travel. Accessible sidewalks should have a cross-slope of no more than 2%.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:cross_slope",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — there is a noticeable tilt across the path",
          },
          {
            value: "no",
            choice_text: "No — the sidewalk is mostly level across its width",
          },
        ],
      },
      {
        template_quest_id: "obstacle",
        quest_title: "Are there any obstructions along this sidewalk?",
        quest_description:
          "Look for anything blocking or narrowing the path: utility poles, overgrown plants, parked bicycles, construction, sandwich boards, etc.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:obstacle",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — one or more obstructions are present",
          },
          { value: "no", choice_text: "No — the path is clear" },
        ],
      },
      {
        template_quest_id: "obstacle-type",
        quest_title: "What type of obstructions are present?",
        quest_description: "Select all that apply.",
        quest_type: "MultipleChoice",
        quest_tag: "ext:obstacle_type",
        quest_answer_dependency: {
          question_id: "obstacle",
          required_value: "yes",
        },
        quest_answer_choices: [
          {
            value: "utility_pole",
            choice_text: "Utility pole or fire hydrant",
          },
          { value: "vegetation", choice_text: "Overgrown vegetation" },
          { value: "bollard", choice_text: "Bollard or post" },
          {
            value: "construction",
            choice_text: "Construction or temporary barrier",
          },
          { value: "parked_vehicle", choice_text: "Parked vehicle or bicycle" },
          {
            value: "street_furniture",
            choice_text: "Street furniture (bench, sign, etc.)",
          },
          { value: "other", choice_text: "Other" },
        ],
      },
      {
        template_quest_id: "buffer",
        quest_title:
          "Is there a buffer between this sidewalk and the adjacent roadway?",
        quest_description:
          "A buffer is a physical separation between the sidewalk and the road, such as a planting strip, parking lane, or bike lane.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:buffer",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — there is a buffer present" },
          {
            value: "no",
            choice_text: "No — the sidewalk is directly adjacent to the road",
          },
        ],
      },
    ],
  },
  {
    id: "sidewalk-auto-capture",
    label: "Sidewalk AutoCapture",
    description:
      "Adds an AutoCapture quest for width, incline, cross-slope, surface, height from ground, and LiDAR measurements.",
    elementCategories: ["sidewalk"],
    quests: [
      {
        template_quest_id: "sidewalk-auto-capture",
        quest_title: "Capture sidewalk attributes",
        quest_description:
          "Automatically captures width, incline, cross-slope, surface condition, height from ground, and LiDAR depth.",
        quest_type: "AutoCapture",
        auto_capture_attributes: {
          ac_width: "ext:ac:width",
          ac_incline: "ext:ac:incline",
          ac_cross_slope: "ext:ac:cross_slope",
          ac_surface_integrity: "ext:ac:surface_integrity",
          ac_surface_disruption: "ext:ac:surface_disruption",
          ac_height_from_ground: "ext:ac:height_from_ground",
          ac_lidar_depth: "ext:ac:lidar_depth",
        },
      },
    ],
  },
  {
    id: "crossing-basics",
    label: "Crossing Details",
    description:
      "Adds comprehensive questions covering markings, signals, APS features, island, lighting, and surface condition for a pedestrian crossing.",
    elementCategories: ["crossing", "signalized-crossing"],
    quests: [
      {
        template_quest_id: "crossing-markings",
        quest_title: "Are there pavement markings for this crossing?",
        quest_description:
          "Determine whether there are high-visibility markings painted on the road surface to indicate the pedestrian crossing.",
        quest_type: "ExclusiveChoice",
        quest_tag: "crossing:markings",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — markings are present" },
          { value: "no", choice_text: "No — no markings present" },
        ],
      },
      {
        template_quest_id: "marking-type",
        quest_title: "What type of marking is present?",
        quest_description:
          "Select the marking style that best describes this crossing.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:crossing:markings:type",
        quest_answer_dependency: {
          question_id: "crossing-markings",
          required_value: "yes",
        },
        quest_answer_choices: [
          {
            value: "zebra",
            choice_text: "Zebra (alternating wide white stripes)",
          },
          {
            value: "ladder",
            choice_text:
              "Ladder or high-visibility (zebra with parallel border lines)",
          },
          { value: "lines", choice_text: "Parallel lines only" },
          { value: "other", choice_text: "Other" },
        ],
      },
      {
        template_quest_id: "crossing-signals",
        quest_title: "Are there pedestrian traffic signals at this crossing?",
        quest_description:
          "Look for a pedestrian signal head with a walk/don't-walk indicator or countdown timer.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:crossing:signals",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — signals are present" },
          { value: "no", choice_text: "No — no signals present" },
        ],
      },
      {
        template_quest_id: "aps-features",
        quest_title:
          "What Accessible Pedestrian Signal (APS) features are present?",
        quest_description:
          "Select all accessible signal features present at this crossing.",
        quest_type: "MultipleChoice",
        quest_tag: "ext:crossing:aps:features",
        quest_answer_dependency: {
          question_id: "crossing-signals",
          required_value: "yes",
        },
        quest_answer_choices: [
          { value: "sound", choice_text: "Audible tone or speech output" },
          { value: "vibration", choice_text: "Vibrotactile indicator" },
          { value: "arrow", choice_text: "Tactile arrow on push button" },
          {
            value: "button",
            choice_text: "Push button to request walk signal",
          },
        ],
      },
      {
        template_quest_id: "crossing-island",
        quest_title: "Is there a pedestrian refuge island at this crossing?",
        quest_description:
          "A refuge island is a raised or marked area in the middle of the road where pedestrians can stop safely between traffic lanes.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:crossing:island",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — a refuge island is present" },
          { value: "no", choice_text: "No — no island present" },
        ],
      },
      {
        template_quest_id: "crossing-lit",
        quest_title: "Is this crossing adequately lit at night?",
        quest_description:
          "Assess whether the crossing area has sufficient lighting for safe use after dark.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:crossing:lit",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — well lit" },
          { value: "no", choice_text: "No — poorly lit or unlit" },
        ],
      },
      {
        template_quest_id: "crossing-surface-condition",
        quest_title: "What is the surface condition of this crossing?",
        quest_description:
          "Check the crossing surface for cracks, heaving, uneven sections, or other damage.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:crossing:surface_condition",
        quest_answer_choices: [
          { value: "good", choice_text: "Good — smooth and intact" },
          { value: "fair", choice_text: "Fair — minor damage, mostly usable" },
          {
            value: "poor",
            choice_text: "Poor — significant damage or hazards",
          },
        ],
      },
    ],
  },
  {
    id: "road-basics",
    label: "Road Accessibility",
    description:
      "Adds questions covering surface, pedestrian access, speed limit, lane count, lighting, traffic volume, and pedestrian route for a road segment.",
    elementCategories: ["road"],
    quests: [
      {
        template_quest_id: "road-surface",
        quest_title: "What is the surface material of this road?",
        quest_description:
          "Determine the primary surface material of this road segment.",
        quest_type: "ExclusiveChoice",
        quest_tag: "surface",
        quest_answer_choices: [
          { value: "asphalt", choice_text: "Asphalt" },
          { value: "concrete", choice_text: "Concrete" },
          {
            value: "paving_stones",
            choice_text: "Paving stones or cobblestones",
          },
          { value: "gravel", choice_text: "Gravel" },
          { value: "unpaved", choice_text: "Unpaved (dirt, mud)" },
          { value: "other", choice_text: "Other" },
        ],
      },
      {
        template_quest_id: "foot-access",
        quest_title: "Can pedestrians walk on this road?",
        quest_description:
          "Determine whether pedestrians are allowed or able to use the road surface itself (e.g., no adjacent sidewalk).",
        quest_type: "ExclusiveChoice",
        quest_tag: "foot",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — pedestrians may use this road" },
          {
            value: "designated",
            choice_text:
              "Yes — pedestrians are the primary or designated users",
          },
          { value: "no", choice_text: "No — pedestrians are not permitted" },
          {
            value: "permissive",
            choice_text:
              "Restricted — pedestrians are tolerated but not officially permitted",
          },
        ],
      },
      {
        template_quest_id: "speed-limit",
        quest_title: "What is the posted speed limit on this road? (km/h)",
        quest_description:
          "Enter the speed limit as posted on road signs. Enter 0 if no sign is visible.",
        quest_type: "Numeric",
        quest_tag: "ext:maxspeed",
        quest_answer_validation: {
          min: 0,
          max: 150,
        },
      },
      {
        template_quest_id: "lane-count",
        quest_title: "How many lanes does this road have?",
        quest_description:
          "Count the total number of motor vehicle travel lanes in both directions.",
        quest_type: "Numeric",
        quest_tag: "ext:lanes",
        quest_answer_validation: {
          min: 0,
          max: 10,
        },
      },
      {
        template_quest_id: "road-lit",
        quest_title: "Is there street lighting on this road?",
        quest_description:
          "Determine whether this road segment has street lamps providing illumination at night.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:lit",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — street lighting is present" },
          { value: "no", choice_text: "No — no street lighting" },
        ],
      },
      {
        template_quest_id: "traffic-volume",
        quest_title:
          "How would you rate the motor vehicle traffic volume on this road?",
        quest_description: "Estimate how busy this road feels to a pedestrian.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:traffic_volume",
        quest_answer_choices: [
          { value: "low", choice_text: "Low — rarely any vehicles" },
          {
            value: "medium",
            choice_text: "Medium — moderate, intermittent traffic",
          },
          { value: "high", choice_text: "High — frequent or constant traffic" },
        ],
      },
      {
        template_quest_id: "pedestrian-route",
        quest_title: "Is there a safe pedestrian route along this road?",
        quest_description:
          "Determine whether pedestrians have a dedicated or reasonably safe path alongside this road, such as a sidewalk, shared-use path, or marked shoulder.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:pedestrian_route_present",
        quest_answer_choices: [
          { value: "sidewalk", choice_text: "Yes — a sidewalk is present" },
          {
            value: "shared_path",
            choice_text: "Yes — a shared-use path is present",
          },
          {
            value: "shoulder",
            choice_text: "Partial — a marked shoulder is present",
          },
          { value: "no", choice_text: "No — pedestrians must share the road" },
        ],
      },
    ],
  },
  {
    id: "stairs-basics",
    label: "Staircase Accessibility",
    description:
      "Adds questions covering step count, surface, width, handrail, tactile paving, ramp/lift alternative, and surface condition for a staircase.",
    elementCategories: ["stairs"],
    quests: [
      {
        template_quest_id: "step-count",
        quest_title: "How many steps are in this staircase?",
        quest_description:
          "Count the total number of individual steps in this staircase.",
        quest_type: "Numeric",
        quest_tag: "step_count",
        quest_answer_validation: {
          min: 0,
          max: 500,
        },
      },
      {
        template_quest_id: "stairs-surface",
        quest_title: "What is the surface material of these stairs?",
        quest_description:
          "Determine the primary surface material of the stair treads.",
        quest_type: "ExclusiveChoice",
        quest_tag: "surface",
        quest_answer_choices: [
          { value: "concrete", choice_text: "Concrete" },
          { value: "asphalt", choice_text: "Asphalt" },
          { value: "paving_stones", choice_text: "Paving stones or brick" },
          { value: "wood", choice_text: "Wood" },
          { value: "metal", choice_text: "Metal or grating" },
          { value: "other", choice_text: "Other" },
        ],
      },
      {
        template_quest_id: "stairs-width",
        quest_title: "How wide is this staircase? (meters)",
        quest_description:
          "Measure or estimate the usable width of the staircase in meters.",
        quest_type: "Numeric",
        quest_tag: "width",
        quest_answer_validation: {
          min: 0,
          max: 20,
        },
      },
      {
        template_quest_id: "handrail",
        quest_title: "Is there a handrail on this staircase?",
        quest_description:
          "Handrails are required for accessible stairs. Look for rails along the side(s) of the staircase.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:handrail",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — full-length handrail(s) present",
          },
          {
            value: "partial",
            choice_text: "Partial — handrail present but incomplete or short",
          },
          { value: "no", choice_text: "No — no handrail present" },
        ],
      },
      {
        template_quest_id: "handrail-side",
        quest_title: "On which side(s) is the handrail located?",
        quest_description:
          "Select the side(s) of the staircase where a handrail is present, as seen when ascending.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:handrail:side",
        quest_answer_dependency: {
          question_id: "handrail",
          required_value: ["yes", "partial"],
        },
        quest_answer_choices: [
          { value: "left", choice_text: "Left side only (ascending)" },
          { value: "right", choice_text: "Right side only (ascending)" },
          { value: "both", choice_text: "Both sides" },
        ],
      },
      {
        template_quest_id: "stairs-tactile-paving",
        quest_title:
          "Are there tactile warning strips at the top and bottom of these stairs?",
        quest_description:
          "Tactile warning surfaces at the top and bottom of stairs alert visually impaired users to the change in level.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:tactile_paving",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — at both top and bottom" },
          { value: "partial", choice_text: "Partial — at top or bottom only" },
          { value: "no", choice_text: "No — no tactile warning surfaces" },
        ],
      },
      {
        template_quest_id: "stairs-ramp-or-lift",
        quest_title:
          "Is there a ramp or lift available as an alternative to these stairs?",
        quest_description:
          "Look for a nearby ramp, lift, or elevator that provides an accessible alternative route.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:ramp_or_lift",
        quest_answer_choices: [
          { value: "ramp", choice_text: "Yes — a ramp is available" },
          {
            value: "lift",
            choice_text: "Yes — a lift or elevator is available",
          },
          { value: "no", choice_text: "No accessible alternative available" },
        ],
      },
      {
        template_quest_id: "stairs-condition",
        quest_title: "Are the stairs in good condition?",
        quest_description:
          "Assess the overall condition of the steps — look for cracking, damaged nosings, uneven risers, or slippery surfaces.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:surface_condition",
        quest_answer_choices: [
          { value: "good", choice_text: "Good — safe and intact" },
          { value: "fair", choice_text: "Fair — minor damage, mostly usable" },
          {
            value: "poor",
            choice_text: "Poor — significant damage or safety concern",
          },
        ],
      },
    ],
  },
  {
    id: "bus-stop-basics",
    label: "Bus Stop Accessibility",
    description:
      "Adds questions covering landing pad, shelter, seating, signage, and lighting for a bus stop.",
    elementCategories: ["bus_stop"],
    quests: [
      {
        template_quest_id: "landing-pad",
        quest_title: "Is there a boarding landing pad at this bus stop?",
        quest_description:
          "A landing pad is a firm, level surface (minimum 5 ft × 8 ft) adjacent to the road where passengers can safely board and alight.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:landing",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — a landing pad is present" },
          { value: "no", choice_text: "No — no landing pad" },
        ],
      },
      {
        template_quest_id: "connected-to-path",
        quest_title:
          "Is the landing pad connected to the adjacent sidewalk path?",
        quest_description:
          "Determine whether a pedestrian can travel directly from the sidewalk to the bus boarding area without stepping off a curb or crossing an unpaved surface.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:connected_to_path",
        quest_answer_dependency: {
          question_id: "landing-pad",
          required_value: "yes",
        },
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — directly connected" },
          { value: "no", choice_text: "No — not connected" },
        ],
      },
      {
        template_quest_id: "shelter",
        quest_title: "Is there a shelter at this bus stop?",
        quest_description:
          "A shelter provides weather protection for waiting passengers.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:shelter",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — a shelter is present" },
          { value: "no", choice_text: "No — no shelter" },
        ],
      },
      {
        template_quest_id: "stop-seating",
        quest_title: "Is there seating at this bus stop?",
        quest_description:
          "Look for a bench, seat, or other seating option for waiting passengers.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:bench",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — seating is present" },
          { value: "no", choice_text: "No — no seating" },
        ],
      },
      {
        template_quest_id: "stop-bin",
        quest_title: "Is there a waste basket at this bus stop?",
        quest_description:
          "Determine whether a trash or recycling bin is present at this bus stop.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:bin",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — a waste basket is present" },
          { value: "no", choice_text: "No — no waste basket" },
        ],
      },
      {
        template_quest_id: "schedule-posted",
        quest_title: "Is schedule information posted at this bus stop?",
        quest_description:
          "Look for a printed or electronic timetable, route map, or service information posted at the stop.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:bus_schedule",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — schedule information is posted" },
          { value: "no", choice_text: "No — no schedule information" },
        ],
      },
      {
        template_quest_id: "real-time-info",
        quest_title:
          "Is there a real-time information display at this bus stop?",
        quest_description:
          "A real-time display shows live arrival times and service alerts electronically.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:bus_real_time_info",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — a real-time display is present" },
          { value: "no", choice_text: "No — no real-time display" },
        ],
      },
      {
        template_quest_id: "stop-lit",
        quest_title: "Is this bus stop adequately lit at night?",
        quest_description:
          "Assess whether there is sufficient lighting at this stop for safe use after dark.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:lit",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — well lit" },
          { value: "no", choice_text: "No — poorly lit or unlit" },
        ],
      },
    ],
  },
  {
    id: "entrance-basics",
    label: "Entrance Accessibility",
    description:
      "Adds questions covering accessibility signage, door type, hardware, force, level access, width, vestibule, and interior steps for an entrance.",
    elementCategories: ["entrance"],
    quests: [
      {
        template_quest_id: "accessibility-signed",
        quest_title:
          "Is there signage indicating this is an accessible entrance?",
        quest_description:
          "Look for the international symbol of accessibility (wheelchair icon) or other signage explicitly marking this as the accessible entrance.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:accessibility:signed",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — accessibility signage is present",
          },
          { value: "no", choice_text: "No — no accessibility signage" },
        ],
      },
      {
        template_quest_id: "door-present",
        quest_title: "Is there a door at this entrance?",
        quest_description:
          "Determine whether this entrance has one or more door panels (as opposed to an open archway or automatic revolving door).",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:door",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — a door is present" },
          { value: "no", choice_text: "No — no door (open passage)" },
        ],
      },
      {
        template_quest_id: "door-hardware",
        quest_title: "What type of door hardware is used?",
        quest_description:
          "Lever handles and push plates are the most accessible hardware types. Knobs require tight gripping and twisting.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:door:hardware:type",
        quest_answer_dependency: {
          question_id: "door-present",
          required_value: "yes",
        },
        quest_answer_choices: [
          { value: "lever", choice_text: "Lever handle" },
          { value: "knob", choice_text: "Round knob" },
          { value: "pull", choice_text: "Pull bar or push plate" },
          {
            value: "automatic",
            choice_text: "Automatic (no manual hardware needed)",
          },
          { value: "other", choice_text: "Other" },
        ],
      },
      {
        template_quest_id: "door-force",
        quest_title: "Can this door be opened without excessive force?",
        quest_description:
          "Accessible doors should require no more than 5 lbs (22 N) of force to open. Push or pull the door and assess the effort required.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:door:compliant_force",
        quest_answer_dependency: {
          question_id: "door-present",
          required_value: "yes",
        },
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — opens easily with minimal force",
          },
          { value: "no", choice_text: "No — requires significant force" },
        ],
      },
      {
        template_quest_id: "level-with-ground",
        quest_title: "Is this entrance level with the ground outside?",
        quest_description:
          "Check whether the entrance is at the same level as the sidewalk without a step, threshold lip, or ramp. Slopes along the route should not exceed 1:20 (5%).",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:level_with_ground",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — level with the surrounding ground",
          },
          {
            value: "no",
            choice_text: "No — there is a step or significant slope",
          },
        ],
      },
      {
        template_quest_id: "entrance-ramp-or-lift",
        quest_title: "Is a ramp or lift available at this entrance?",
        quest_description:
          "If there is a step or slope, look for a nearby ramp or lift providing an accessible route into the building.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:ramp_or_lift",
        quest_answer_dependency: {
          question_id: "level-with-ground",
          required_value: "no",
        },
        quest_answer_choices: [
          { value: "ramp", choice_text: "Yes — a ramp is available" },
          {
            value: "lift",
            choice_text: "Yes — a lift or platform is available",
          },
          {
            value: "no",
            choice_text: "No accessible alternative at this entrance",
          },
        ],
      },
      {
        template_quest_id: "entrance-width",
        quest_title: "Is this entrance wide enough for wheelchair access?",
        quest_description:
          "The minimum accessible clear opening width is 32 inches (81 cm). A 36-inch (91 cm) clear opening is preferred.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:compliant_width",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — at least 32 inches wide" },
          { value: "no", choice_text: "No — appears narrower than 32 inches" },
        ],
      },
      {
        template_quest_id: "vestibule",
        quest_title:
          "Is there a vestibule (two doors in a row) at this entrance?",
        quest_description:
          "A vestibule has two sequential door sets. For wheelchair access, there must be at least 48 inches of clear floor space between the two doors (plus the door swing width).",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:vestibule",
        quest_answer_dependency: {
          question_id: "door-present",
          required_value: "yes",
        },
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — two doors in a row" },
          { value: "no", choice_text: "No — single door set" },
        ],
      },
      {
        template_quest_id: "no-interior-steps",
        quest_title:
          "After entering, is the interior path accessible without steps?",
        quest_description:
          "Once inside, check whether the immediate interior path forward is step-free and does not require navigating a steep slope.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:no_interior_steps",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — the interior path is step-free" },
          {
            value: "no",
            choice_text:
              "No — steps or steep slopes are present immediately inside",
          },
        ],
      },
    ],
  },
  {
    id: "elevator-basics",
    label: "Elevator Accessibility",
    description:
      "Adds questions covering controls, announcements, location, emergency call, mirror, and operating hours for an elevator.",
    elementCategories: ["elevator"],
    quests: [
      {
        template_quest_id: "elevator-buttons",
        quest_title: "What type of controls does this elevator have?",
        quest_description:
          "Accessible elevators should have mechanical buttons with both raised characters and Braille labelling on the inner control panel.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:elevator_buttons",
        quest_answer_choices: [
          {
            value: "buttons_tactile",
            choice_text:
              "Mechanical buttons with Braille and raised character labelling",
          },
          {
            value: "buttons_not_tactile",
            choice_text: "Mechanical buttons without tactile labelling",
          },
          {
            value: "touchscreen",
            choice_text: "Touchscreen or destination dispatch system",
          },
          { value: "other", choice_text: "Other" },
        ],
      },
      {
        template_quest_id: "elevator-announcements",
        quest_title: "Does this elevator have audio announcements?",
        quest_description:
          "Accessible elevators should announce the current floor verbally when the doors open.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:elevator_announcements",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — floor announcements are present",
          },
          { value: "no", choice_text: "No — no audio announcements" },
        ],
      },
      {
        template_quest_id: "elevator-indoors",
        quest_title: "Is this elevator located indoors?",
        quest_description:
          "Determine whether this elevator is inside a building or exposed to the outdoor environment.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:elevator_indoors",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — indoors" },
          { value: "no", choice_text: "No — outdoors or in an open structure" },
        ],
      },
      {
        template_quest_id: "elevator-emergency-call",
        quest_title: "Is there an emergency call button inside this elevator?",
        quest_description:
          "An accessible elevator should have an emergency call button or phone that is reachable from a wheelchair (typically ≤ 54 inches from the floor).",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:elevator_emergency_call",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — emergency call button is present",
          },
          { value: "no", choice_text: "No — no emergency call button visible" },
        ],
      },
      {
        template_quest_id: "elevator-mirror",
        quest_title:
          "Is there a mirror or reflective surface inside this elevator?",
        quest_description:
          "A mirror on the rear wall of an elevator allows wheelchair users to see behind them when backing out, improving safety.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:elevator_mirror",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — mirror or reflective surface is present",
          },
          { value: "no", choice_text: "No — no mirror" },
        ],
      },
      {
        template_quest_id: "elevator-schedule",
        quest_title: "Is this elevator subject to limited operating hours?",
        quest_description:
          "Some elevators are locked during certain hours or require a key or security clearance to access.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:elevator_schedule",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text:
              "Yes — the elevator has restricted hours or requires access",
          },
          { value: "no", choice_text: "No — available at all hours" },
        ],
      },
      {
        template_quest_id: "elevator-hours",
        quest_title: "What are the operating hours for this elevator?",
        quest_description:
          'Enter a description of the operating hours (e.g., "Mon–Fri 7am–10pm, Sat–Sun 9am–6pm").',
        quest_type: "TextEntry",
        quest_tag: "ext:elevator_hours",
        quest_answer_dependency: {
          question_id: "elevator-schedule",
          required_value: "yes",
        },
      },
    ],
  },
  {
    id: "bench-basics",
    label: "Bench Accessibility",
    description:
      "Adds questions covering backrest, armrest, material, shade, approach accessibility, area condition, and nearby waste basket for a bench.",
    elementCategories: ["bench"],
    quests: [
      {
        template_quest_id: "backrest",
        quest_title: "Does this bench have a backrest?",
        quest_description:
          "A backrest provides support and makes seating more accessible for people with limited mobility or fatigue.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:backrest",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — full backrest present" },
          { value: "partial", choice_text: "Partial — low or short backrest" },
          { value: "no", choice_text: "No — no backrest" },
        ],
      },
      {
        template_quest_id: "armrest",
        quest_title: "Does this bench have armrests?",
        quest_description:
          "Armrests help people lower themselves onto and rise from the bench, improving accessibility for people with limited strength or joint problems.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:armrest",
        quest_answer_choices: [
          {
            value: "yes",
            choice_text: "Yes — armrests present (at least on one end)",
          },
          { value: "no", choice_text: "No — no armrests" },
        ],
      },
      {
        template_quest_id: "bench-material",
        quest_title: "What material is this bench made of?",
        quest_description:
          "Select the primary material of the bench seat and frame.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:material",
        quest_answer_choices: [
          { value: "wood", choice_text: "Wood" },
          { value: "metal", choice_text: "Metal or steel" },
          { value: "concrete", choice_text: "Concrete or stone" },
          { value: "plastic", choice_text: "Plastic or recycled composite" },
          { value: "other", choice_text: "Other" },
        ],
      },
      {
        template_quest_id: "shade",
        quest_title: "Is there shade available at this bench?",
        quest_description:
          "Shade from trees, a shelter, or a canopy makes seating more comfortable and safer in warm weather.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:shade",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — mostly shaded" },
          {
            value: "partial",
            choice_text: "Partial — shade at certain times of day",
          },
          { value: "no", choice_text: "No — fully exposed to sun" },
        ],
      },
      {
        template_quest_id: "accessible-approach",
        quest_title: "Is this bench accessible from the adjacent path?",
        quest_description:
          "Determine whether someone using a wheelchair or mobility aid can easily approach and sit alongside this bench without encountering steps, steep slopes, or barriers.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:accessible_approach",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — accessible approach path" },
          {
            value: "no",
            choice_text: "No — steps, barriers, or rough surface blocks access",
          },
        ],
      },
      {
        template_quest_id: "area-surface-condition",
        quest_title:
          "What is the condition of the surface immediately around this bench?",
        quest_description:
          "Assess the ground surface directly adjacent to the bench that a user would need to navigate to use the bench.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:area_surface_condition",
        quest_answer_choices: [
          { value: "good", choice_text: "Good — firm, level, and clear" },
          { value: "fair", choice_text: "Fair — minor issues" },
          { value: "poor", choice_text: "Poor — uneven, muddy, or obstructed" },
        ],
      },
      {
        template_quest_id: "bin-nearby",
        quest_title: "Is there a waste basket near this bench?",
        quest_description:
          "A nearby waste basket improves the usability and cleanliness of the resting area.",
        quest_type: "ExclusiveChoice",
        quest_tag: "ext:bin_nearby",
        quest_answer_choices: [
          { value: "yes", choice_text: "Yes — a waste basket is nearby" },
          { value: "no", choice_text: "No — no waste basket nearby" },
        ],
      },
    ],
  },
];
