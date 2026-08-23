/* Source unique de vérité pour les parcours, modules et métadonnées. */
(function (root) {
root.CURRICULUM = {
  ccna1: {
    label: "CCNA 1",
    title: "Introduction aux réseaux",
    desc: "Les fondamentaux : modèles réseau, Ethernet, adressage IP et sécurité de base.",
    color: ["#4f46e5", "#7c3aed"],
    icon: "network",
    modules: [
      { id: "module1", name: "Modules 1 & 3", topic: "Connectivité des réseaux de base et communications", count: 51, icon: "network" },
      { id: "module2", name: "Modules 4 & 7", topic: "Concepts d’Ethernet", count: 56, icon: "ethernet" },
      { id: "module3", name: "Modules 8 & 10", topic: "Communication entre les réseaux", count: 44, icon: "plug" },
      { id: "module4", name: "Modules 11 & 13", topic: "Adressage IP", count: 47, icon: "stack" },
      { id: "module5", name: "Modules 14 & 15", topic: "Communications des applications du réseau", count: 55, icon: "layers" },
      { id: "module6", name: "Modules 16 & 17", topic: "Création et sécurisation d’un réseau de petite taille", count: 52, icon: "shield" }
    ]
  },
  ccna2: {
    label: "CCNA 2",
    title: "Commutation, routage et sans-fil",
    desc: "VLAN, routage inter-VLAN, réseaux redondants, sécurité de couche 2 et WLAN.",
    color: ["#0ea5e9", "#2563eb"],
    icon: "router",
    modules: [
      { id: "module1", name: "Modules 1 & 4", topic: "Concepts de commutation, VLAN et routage inter-VLAN", count: 44, icon: "router" },
      { id: "module2", name: "Modules 5 & 6", topic: "Réseaux redondants", count: 38, icon: "redundant" },
      { id: "module3", name: "Modules 7 & 9", topic: "Réseaux disponibles et fiables", count: 39, icon: "shield-check" },
      { id: "module4", name: "Modules 10 & 13", topic: "Sécurité de couche 2 et réseau sans fil (WLAN)", count: 64, icon: "wifi" },
      { id: "module5", name: "Modules 14 & 16", topic: "Concepts de routage et configuration", count: 56, icon: "route" },
      { id: "module6", name: "Examen final", topic: "Examen final du cours CCNA 2", count: 173, icon: "trophy" }
    ]
  },
  csna: {
    label: "CSNA",
    title: "Cisco Certified Support Network",
    desc: "Entraînement global aux compétences de support et d’administration réseau.",
    color: ["#059669", "#10b981"],
    icon: "shield",
    warning: "Les questions sont proposées uniquement à titre éducatif. Les réponses ne sont pas garanties exactes. Vérifiez toujours avec des sources fiables.",
    modules: [
      { id: "module1", name: "Quiz CSNA", topic: "Entraînement global aux compétences CSNA", count: 146, icon: "shield" }
    ]
  },
  csne: {
    label: "CSNE",
    title: "Cisco Certified Network Engineer",
    desc: "Entraînement global aux compétences d’ingénierie réseau.",
    color: ["#d97706", "#f59e0b"],
    icon: "shield-check",
    warning: "Les questions sont proposées uniquement à titre éducatif. Les réponses ne sont pas garanties exactes. Vérifiez toujours avec des sources fiables.",
    modules: [
      { id: "module1", name: "Quiz CSNE", topic: "Entraînement global aux compétences CSNE", count: 96, icon: "shield-check" }
    ]
  }
};
})(typeof window !== "undefined" ? window : globalThis);
