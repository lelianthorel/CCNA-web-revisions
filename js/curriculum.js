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
      { id: "module1", name: "Modules 1 & 3", topic: "Connectivité des réseaux de base et communications", count: 55, icon: "network" },
      { id: "module2", name: "Modules 4 & 7", topic: "Concepts d’Ethernet", count: 62, icon: "ethernet" },
      { id: "module3", name: "Modules 8 & 10", topic: "Communication entre les réseaux", count: 56, icon: "plug" },
      { id: "module4", name: "Modules 11 & 13", topic: "Adressage IP", count: 52, icon: "stack" },
      { id: "module5", name: "Modules 14 & 15", topic: "Communications des applications du réseau", count: 55, icon: "layers" },
      { id: "module6", name: "Modules 16 & 17", topic: "Création et sécurisation d’un réseau de petite taille", count: 56, icon: "shield" },
      { id: "module7", name: "Examen final", topic: "Examen final du cours CCNA 1 (ITNv7)", count: 140, icon: "trophy" }
    ]
  },
  ccna2: {
    label: "CCNA 2",
    title: "Commutation, routage et sans-fil",
    desc: "VLAN, routage inter-VLAN, réseaux redondants, sécurité de couche 2 et WLAN.",
    color: ["#0ea5e9", "#2563eb"],
    icon: "router",
    modules: [
      { id: "module1", name: "Modules 1 & 4", topic: "Concepts de commutation, VLAN et routage inter-VLAN", count: 63, icon: "router" },
      { id: "module2", name: "Modules 5 & 6", topic: "Réseaux redondants", count: 48, icon: "redundant" },
      { id: "module3", name: "Modules 7 & 9", topic: "Réseaux disponibles et fiables", count: 50, icon: "shield-check" },
      { id: "module4", name: "Modules 10 & 13", topic: "Sécurité de couche 2 et réseau sans fil (WLAN)", count: 71, icon: "wifi" },
      { id: "module5", name: "Modules 14 & 16", topic: "Concepts de routage et configuration", count: 54, icon: "route" },
      { id: "module6", name: "Examen final", topic: "Examen final du cours CCNA 2", count: 168, icon: "trophy" }
    ]
  },
  ccna3: {
    label: "CCNA 3",
    title: "Réseaux d’entreprise, sécurité et automatisation",
    desc: "OSPF, sécurité des réseaux et ACL, technologies WAN, supervision, dépannage et automatisation.",
    color: ["#0d9488", "#14b8a6"],
    icon: "route",
    isNew: true,
    modules: [
      { id: "module1", name: "Modules 1 & 2", topic: "Concepts et configuration d’OSPF", count: 44, icon: "route" },
      { id: "module2", name: "Modules 3 & 5", topic: "Sécurité des réseaux", count: 56, icon: "shield" },
      { id: "module3", name: "Modules 6 & 8", topic: "Concepts WAN", count: 52, icon: "network" },
      { id: "module4", name: "Modules 9 & 12", topic: "Optimisation, surveillance et dépannage des réseaux", count: 53, icon: "chart" },
      { id: "module5", name: "Modules 13 & 14", topic: "Technologies de réseau émergentes", count: 34, icon: "layers" },
      { id: "module6", name: "Examen final", topic: "Examen final du cours CCNA 3 (ENSAv7)", count: 127, icon: "trophy" }
    ]
  },
  csna: {
    label: "CSNA",
    title: "Certified Stormshield Network Administrator",
    desc: "Administration des firewalls Stormshield Network Security (SNS) : politiques de filtrage et de routage, authentification et réseaux VPN.",
    color: ["#059669", "#10b981"],
    icon: "shield",
    warning: "Les questions sont proposées uniquement à titre éducatif. Les réponses ne sont pas garanties exactes. Vérifiez toujours avec des sources fiables.",
    modules: [
      { id: "module1", name: "Quiz CSNA", topic: "Entraînement aux compétences d’administration Stormshield SNS", count: 146, icon: "shield" }
    ]
  },
  csne: {
    label: "CSNE",
    title: "Certified Stormshield Network Expert",
    desc: "Exploitation avancée des firewalls Stormshield SNS : prévention d’intrusions, PKI, VPN IPSec par certificat et haute disponibilité.",
    color: ["#d97706", "#f59e0b"],
    icon: "shield-check",
    warning: "Les questions sont proposées uniquement à titre éducatif. Les réponses ne sont pas garanties exactes. Vérifiez toujours avec des sources fiables.",
    modules: [
      { id: "module1", name: "Quiz CSNE", topic: "Entraînement aux compétences expertes Stormshield SNS", count: 96, icon: "shield-check" }
    ]
  }
};
})(typeof window !== "undefined" ? window : globalThis);
