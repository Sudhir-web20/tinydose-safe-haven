export type MedicineType =
  | "Syrup"
  | "Drops"
  | "Tablet"
  | "Cream"
  | "Ointment"
  | "Inhaler"
  | "Other";

export interface MedicineSuggestion {
  name: string;
  generic: string;
  type: MedicineType;
}

export const MEDICINE_DB: MedicineSuggestion[] = [
  { name: "Calpol 120", generic: "Paracetamol", type: "Syrup" },
  { name: "Calpol 250", generic: "Paracetamol", type: "Syrup" },
  { name: "Crocin Drops", generic: "Paracetamol", type: "Drops" },
  { name: "Tempra Syrup", generic: "Paracetamol", type: "Syrup" },
  { name: "Tylenol Infant", generic: "Acetaminophen", type: "Drops" },
  { name: "Panadol Baby", generic: "Paracetamol", type: "Syrup" },
  { name: "Brufen Syrup", generic: "Ibuprofen", type: "Syrup" },
  { name: "Ibugesic Plus", generic: "Ibuprofen + Paracetamol", type: "Syrup" },
  { name: "Nurofen for Children", generic: "Ibuprofen", type: "Syrup" },
  { name: "Meftal-P", generic: "Mefenamic Acid", type: "Syrup" },
  { name: "Cetzine Syrup", generic: "Cetirizine", type: "Syrup" },
  { name: "Zyrtec Drops", generic: "Cetirizine", type: "Drops" },
  { name: "Allegra Kids", generic: "Fexofenadine", type: "Syrup" },
  { name: "Phenergan Syrup", generic: "Promethazine", type: "Syrup" },
  { name: "Ascoril LS", generic: "Levosalbutamol + Ambroxol", type: "Syrup" },
  { name: "Mucaine Pediatric", generic: "Ambroxol", type: "Syrup" },
  { name: "Benadryl Cough", generic: "Diphenhydramine", type: "Syrup" },
  { name: "T-Minic Drops", generic: "Phenylephrine + Chlorpheniramine", type: "Drops" },
  { name: "Nasivion Baby", generic: "Oxymetazoline", type: "Drops" },
  { name: "Otrivin Baby", generic: "Sodium Chloride", type: "Drops" },
  { name: "Sinarest Drops", generic: "Paracetamol + Phenylephrine", type: "Drops" },
  { name: "Domstal Suspension", generic: "Domperidone", type: "Syrup" },
  { name: "Emeset Syrup", generic: "Ondansetron", type: "Syrup" },
  { name: "Zofer MD", generic: "Ondansetron", type: "Tablet" },
  { name: "Enterogermina", generic: "Bacillus Clausii", type: "Other" },
  { name: "Sporlac Drops", generic: "Lactic Acid Bacillus", type: "Drops" },
  { name: "ORS Pedialyte", generic: "Oral Rehydration Salts", type: "Other" },
  { name: "Cyclopam Drops", generic: "Dicyclomine", type: "Drops" },
  { name: "Colicaid Drops", generic: "Simethicone + Dill Oil", type: "Drops" },
  { name: "Neopeptine Drops", generic: "Alpha Amylase + Papain", type: "Drops" },
  { name: "Gripe Water", generic: "Dill Oil + Sodium Bicarbonate", type: "Other" },
  { name: "Becosules Drops", generic: "Vitamin B-Complex", type: "Drops" },
  { name: "Zincovit Syrup", generic: "Multivitamin + Zinc", type: "Syrup" },
  { name: "Vitamin D3 Drops", generic: "Cholecalciferol", type: "Drops" },
  { name: "Tonoferon Drops", generic: "Iron + Folic Acid", type: "Drops" },
  { name: "Augmentin Duo", generic: "Amoxicillin + Clavulanate", type: "Syrup" },
  { name: "Mox Drops", generic: "Amoxicillin", type: "Drops" },
  { name: "Azithral Liquid", generic: "Azithromycin", type: "Syrup" },
  { name: "Cefixime Oral", generic: "Cefixime", type: "Syrup" },
  { name: "Bactroban", generic: "Mupirocin", type: "Ointment" },
  { name: "Soframycin", generic: "Framycetin", type: "Cream" },
  { name: "Sebamed Baby Cream", generic: "Panthenol", type: "Cream" },
  { name: "Mustela Diaper Cream", generic: "Zinc Oxide", type: "Cream" },
  { name: "Desitin", generic: "Zinc Oxide", type: "Ointment" },
  { name: "Hydrocortisone 1%", generic: "Hydrocortisone", type: "Cream" },
  { name: "Candid Powder", generic: "Clotrimazole", type: "Other" },
  { name: "Asthalin Inhaler", generic: "Salbutamol", type: "Inhaler" },
  { name: "Budecort", generic: "Budesonide", type: "Inhaler" },
  { name: "Foracort", generic: "Formoterol + Budesonide", type: "Inhaler" },
  { name: "Montair LC Kid", generic: "Montelukast + Levocetirizine", type: "Tablet" },
  { name: "Singulair", generic: "Montelukast", type: "Tablet" },
];

export function searchMedicines(query: string): MedicineSuggestion[] {
  if (query.length < 3) return [];
  const q = query.toLowerCase();
  return MEDICINE_DB.filter(
    (m) => m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q),
  ).slice(0, 8);
}
