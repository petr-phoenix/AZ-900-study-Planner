/* ==========================================================
   AZ-900 Study Planner — static data
   Edit this file to change exam dates, modules or questions.
   ========================================================== */

// Exam skill domains. `weight` = midpoint of Microsoft's published % range.
const DOMAINS = {
  cloud: {
    id: "cloud", name: "Cloud concepts", short: "Cloud", emoji: "☁️",
    weight: 27.5, color: "#0ea5e9",
    url: "https://learn.microsoft.com/en-us/training/paths/microsoft-azure-fundamentals-describe-cloud-concepts/",
  },
  arch: {
    id: "arch", name: "Azure architecture and services", short: "Architecture", emoji: "🏗️",
    weight: 37.5, color: "#8b5cf6",
    url: "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals-describe-azure-architecture-services/",
  },
  mgmt: {
    id: "mgmt", name: "Azure management and governance", short: "Management", emoji: "🛠️",
    weight: 32.5, color: "#10b981",
    url: "https://learn.microsoft.com/en-us/training/paths/describe-azure-management-governance/",
  },
};

// Exam dates (local dates, YYYY-MM-DD). Past dates are shown as "Passed".
const EXAMS = [
  { date: "2026-10-19", label: "Mon 19 Oct 2026" },
  { date: "2026-10-21", label: "Wed 21 Oct 2026" },
  { date: "2026-10-23", label: "Fri 23 Oct 2026" },
  { date: "2026-10-26", label: "Mon 26 Oct 2026" },
];

const MOCK_PASS_PCT = 70; // AZ-900 pass mark is 700 / 1000

// Learning-path modules (titles follow the three Microsoft Learn paths; minutes are approximate).
const MODULES = [
  // Path 1 — Describe cloud concepts
  { id: "c1", d: "cloud", title: "Introduction to Azure fundamentals", mins: 30, topics: ["What is Azure", "Cloud models", "Azure services overview"] },
  { id: "c2", d: "cloud", title: "Describe cloud computing", mins: 40, topics: ["Shared responsibility", "Public / private / hybrid", "CapEx vs OpEx", "Consumption model"] },
  { id: "c3", d: "cloud", title: "Describe the benefits of using cloud services", mins: 40, topics: ["High availability", "Scalability & elasticity", "Reliability", "Predictability", "Security & governance"] },
  { id: "c4", d: "cloud", title: "Describe cloud service types", mins: 40, topics: ["IaaS", "PaaS", "SaaS", "Serverless"] },

  // Path 2 — Describe Azure architecture and services
  { id: "a1", d: "arch", title: "Describe the core architectural components of Azure", mins: 70, topics: ["Regions & region pairs", "Availability zones", "Resource groups", "Subscriptions", "Management groups"] },
  { id: "a2", d: "arch", title: "Describe Azure compute and networking services", mins: 90, topics: ["VMs & scale sets", "App Service", "Containers", "Functions", "VNet", "VPN Gateway", "ExpressRoute", "DNS"] },
  { id: "a3", d: "arch", title: "Describe Azure storage services", mins: 60, topics: ["Storage accounts", "Redundancy (LRS/ZRS/GRS)", "Blob tiers", "Files & Disks", "Migration tools"] },
  { id: "a4", d: "arch", title: "Describe Azure identity, access, and security", mins: 75, topics: ["Microsoft Entra ID", "MFA & Conditional Access", "RBAC", "Zero Trust", "Defense in depth", "Defender for Cloud"] },

  // Path 3 — Describe Azure management and governance
  { id: "m1", d: "mgmt", title: "Describe cost management in Azure", mins: 45, topics: ["Cost factors", "Pricing & TCO calculators", "Cost Management", "Tags"] },
  { id: "m2", d: "mgmt", title: "Describe features and tools in Azure for governance and compliance", mins: 50, topics: ["Microsoft Purview", "Azure Policy", "Resource locks", "Service Trust Portal"] },
  { id: "m3", d: "mgmt", title: "Describe features and tools for managing and deploying Azure resources", mins: 70, topics: ["Portal", "Cloud Shell, CLI, PowerShell", "Azure Arc", "ARM & Bicep"] },
  { id: "m4", d: "mgmt", title: "Describe monitoring tools in Azure", mins: 50, topics: ["Azure Advisor", "Service Health", "Azure Monitor", "Log Analytics", "Application Insights"] },
];

// Practice questions — original questions written to mirror the AZ-900 skills outline.
// Format: [id, domain, question, CORRECT answer, [three wrong answers], explanation]
// Options are shuffled at runtime, so the correct answer is always listed first here.
const QUESTION_ROWS = [
  // ---------- Cloud concepts ----------
  ["c1", "cloud", "A company wants to avoid buying hardware up front and instead pay only for the compute it consumes each month. Which pricing model does this describe?",
    "Consumption-based model", ["Capital expenditure (CapEx)", "Fixed-term licensing", "Dedicated hardware lease"],
    "Cloud services use a consumption-based model (operational expenditure): you pay for what you use with no upfront hardware cost."],
  ["c2", "cloud", "Which cloud service model gives the customer the most control over the operating system and installed software?",
    "Infrastructure as a service (IaaS)", ["Software as a service (SaaS)", "Platform as a service (PaaS)", "Serverless computing"],
    "With IaaS you manage the OS, middleware and apps; the provider manages the physical infrastructure."],
  ["c3", "cloud", "Azure SQL Database, where Azure handles patching and the underlying servers, is an example of which service type?",
    "Platform as a service (PaaS)", ["Infrastructure as a service (IaaS)", "Software as a service (SaaS)", "On-premises hosting"],
    "PaaS gives you a managed platform to run your data or code without managing the OS or hardware."],
  ["c4", "cloud", "Microsoft 365 (for example Word Online and Outlook) is best described as which service type?",
    "Software as a service (SaaS)", ["Infrastructure as a service (IaaS)", "Platform as a service (PaaS)", "Private cloud"],
    "SaaS delivers complete applications over the internet; you just use the software."],
  ["c5", "cloud", "In the shared responsibility model, which item is ALWAYS the customer's responsibility, whatever the service type?",
    "Information and data", ["Physical datacenter security", "The physical network", "The host infrastructure"],
    "Customers always own their data, accounts, and identities. Physical datacenter, network and hosts are the provider's."],
  ["c6", "cloud", "A company keeps sensitive workloads in its own datacenter and runs others in Azure, with the two connected. Which cloud model is this?",
    "Hybrid cloud", ["Public cloud", "Private cloud", "Community cloud"],
    "A hybrid cloud combines on-premises (or private) resources with a public cloud."],
  ["c7", "cloud", "An online shop's web app automatically adds VMs during a flash sale and removes them afterwards. Which cloud benefit is this?",
    "Elasticity", ["Predictability", "Manageability", "Geo-distribution"],
    "Elasticity is the ability to automatically scale resources out and in to match demand."],
  ["c8", "cloud", "Buying servers and datacenter space before they are needed is an example of which type of spending?",
    "Capital expenditure (CapEx)", ["Operational expenditure (OpEx)", "Consumption expense", "Subscription expense"],
    "CapEx is an upfront investment in physical infrastructure; cloud shifts spending toward OpEx."],
  ["c9", "cloud", "Which benefit describes a system's ability to recover from failures and continue to function?",
    "Reliability", ["Elasticity", "Agility", "Predictability"],
    "Reliability is resilience: the ability to recover from failures and keep working."],
  ["c10", "cloud", "Adding more CPU and RAM to an existing virtual machine is called:",
    "Scaling up (vertical scaling)", ["Scaling out (horizontal scaling)", "Failover", "Replication"],
    "Vertical scaling adds power to an existing resource; horizontal scaling adds more instances."],
  ["c11", "cloud", "Which statement best describes a public cloud?",
    "Services run on hardware owned by a provider and shared among multiple customers", ["Hardware is owned and used by a single organization only", "Customers must buy and install their own servers", "It cannot be combined with on-premises systems"],
    "Public clouds are multi-tenant: the provider owns and operates the hardware and customers share it."],
  ["c12", "cloud", "What is a service level agreement (SLA) in Azure?",
    "A formal commitment about the expected uptime and connectivity of a service", ["A tool that estimates monthly costs", "A way of tagging resources by department", "A security certification"],
    "SLAs express performance targets (e.g. 99.9% uptime) and what happens if they are not met."],

  // ---------- Azure architecture and services ----------
  ["a1", "arch", "What is the logical container in which Azure resources are deployed and managed together?",
    "Resource group", ["Subscription", "Management group", "Availability set"],
    "Every Azure resource belongs to exactly one resource group, typically sharing a lifecycle."],
  ["a2", "arch", "What are Azure Availability Zones?",
    "Physically separate datacenters within a single Azure region", ["Groups of regions inside a geography", "Logical groupings of VMs on the same rack", "Edge locations for content delivery"],
    "Zones have independent power, cooling and networking, protecting apps from datacenter-level failures."],
  ["a3", "arch", "What is the purpose of Azure region pairs?",
    "Two regions in the same geography that support disaster recovery and sequenced platform updates", ["Two datacenters in one region sharing power", "A billing discount for two regions", "A way to merge subscriptions"],
    "Region pairs offer resilience: Azure updates one region of a pair at a time and prioritizes recovery."],
  ["a4", "arch", "Which Azure construct lets you apply governance conditions across multiple subscriptions?",
    "Management group", ["Resource group", "Tag", "Resource lock"],
    "Management groups sit above subscriptions and let policy and access flow down to everything beneath."],
  ["a5", "arch", "Which Azure service runs small pieces of event-driven code without you managing servers?",
    "Azure Functions", ["Azure Virtual Machines", "Azure Dedicated Host", "Azure Bastion"],
    "Azure Functions is serverless compute: you provide code, Azure handles infrastructure and scaling."],
  ["a6", "arch", "Which service lets you deploy and automatically scale a set of identical virtual machines?",
    "Virtual Machine Scale Sets", ["Azure Bastion", "Azure Backup", "Azure Site Recovery"],
    "Scale sets manage a group of load-balanced, identical VMs that grow or shrink with demand."],
  ["a7", "arch", "Which service provides a private, dedicated connection from on-premises to Azure that does not travel over the public internet?",
    "Azure ExpressRoute", ["Azure VPN Gateway", "Azure DNS", "Azure Application Gateway"],
    "ExpressRoute uses a connectivity provider for a private link; VPN Gateway uses encrypted tunnels over the internet."],
  ["a8", "arch", "Which storage redundancy option copies data synchronously across three availability zones in the primary region?",
    "Zone-redundant storage (ZRS)", ["Locally redundant storage (LRS)", "Geo-redundant storage (GRS)", "Read-access geo-redundant storage (RA-GRS)"],
    "ZRS spreads copies across zones in one region. LRS stays in one datacenter; GRS adds a secondary region."],
  ["a9", "arch", "Which blob access tier has the lowest storage cost for rarely accessed data that can tolerate hours of retrieval time?",
    "Archive", ["Hot", "Cool", "Premium"],
    "Archive is the cheapest to store but data must be rehydrated before it can be read."],
  ["a10", "arch", "Which Azure database service is a globally distributed, multi-model NoSQL database?",
    "Azure Cosmos DB", ["Azure SQL Database", "Azure Database for MySQL", "Azure Synapse Analytics"],
    "Cosmos DB offers multi-region writes, low latency and several APIs."],
  ["a11", "arch", "Which Azure service provides single sign-on, multifactor authentication and Conditional Access?",
    "Microsoft Entra ID", ["Azure Key Vault", "Azure Firewall", "Azure Policy"],
    "Microsoft Entra ID (formerly Azure Active Directory) is Azure's cloud identity and access service."],
  ["a12", "arch", "Which feature would you use to give a user the Reader role on a single resource group?",
    "Azure role-based access control (RBAC)", ["Azure Policy", "Resource locks", "Cost Management"],
    "RBAC assigns roles to identities at a scope (management group, subscription, resource group or resource)."],
  ["a13", "arch", "Which service provides unified security management and threat protection across Azure and hybrid workloads?",
    "Microsoft Defender for Cloud", ["Azure Advisor", "Azure Monitor", "Azure Service Health"],
    "Defender for Cloud assesses your security posture and protects workloads from threats."],
  ["a14", "arch", "Which Azure option runs a container quickly without managing the underlying virtual machines or an orchestrator?",
    "Azure Container Instances", ["Azure Kubernetes Service", "Azure Virtual Desktop", "Azure Batch"],
    "ACI is the simplest way to run a container in Azure; AKS is for orchestrating many containers."],

  // ---------- Azure management and governance ----------
  ["m1", "mgmt", "Which tool estimates the monthly cost of Azure services you plan to deploy?",
    "Pricing calculator", ["Total Cost of Ownership (TCO) calculator", "Azure Advisor", "Azure Service Health"],
    "The pricing calculator estimates costs for the services and configurations you choose."],
  ["m2", "mgmt", "Which tool compares the cost of running workloads on-premises with running them in Azure?",
    "TCO calculator", ["Pricing calculator", "Cost Management", "Azure Monitor"],
    "The TCO calculator models the savings of moving from on-premises to Azure."],
  ["m3", "mgmt", "Your finance team wants to allocate cloud costs by department. Which Azure feature helps most?",
    "Tags", ["Resource locks", "Availability zones", "Network security groups"],
    "Tags are name/value metadata you attach to resources so costs can be grouped and reported."],
  ["m4", "mgmt", "Which service can ensure that resources can only be created in approved regions?",
    "Azure Policy", ["Azure RBAC", "Azure Monitor", "Azure Advisor"],
    "Azure Policy evaluates resources against rules (such as allowed locations) and can deny or audit non-compliance."],
  ["m5", "mgmt", "Which feature prevents accidental deletion of a resource, even by an owner?",
    "Resource lock (CanNotDelete)", ["Azure Policy audit effect", "A tag", "A role assignment"],
    "Resource locks (CanNotDelete or ReadOnly) override user permissions to protect critical resources."],
  ["m6", "mgmt", "Which service helps you govern and protect data across on-premises, multicloud and SaaS sources?",
    "Microsoft Purview", ["Azure Arc", "Azure Bastion", "Azure Lighthouse"],
    "Microsoft Purview provides data governance, risk and compliance solutions."],
  ["m7", "mgmt", "Where can you find Microsoft's compliance reports and audit documentation?",
    "Service Trust Portal", ["Azure Marketplace", "Azure Advisor", "Azure Cloud Shell"],
    "The Service Trust Portal publishes audit reports, certifications and compliance guidance."],
  ["m8", "mgmt", "Which is a browser-based command-line experience for managing Azure resources?",
    "Azure Cloud Shell", ["Azure Storage Explorer", "Azure Migrate", "Azure Bastion"],
    "Cloud Shell offers Bash or PowerShell in the browser, pre-authenticated to your account."],
  ["m9", "mgmt", "Which service is the deployment and management layer that the portal, CLI and PowerShell all call?",
    "Azure Resource Manager (ARM)", ["Azure Arc", "Azure Monitor", "Microsoft Entra ID"],
    "ARM receives every management request and applies access control and templates (JSON or Bicep)."],
  ["m10", "mgmt", "Which service lets you manage on-premises servers and other clouds from Azure as if they were Azure resources?",
    "Azure Arc", ["Azure Advisor", "Azure Site Recovery", "Azure ExpressRoute"],
    "Azure Arc projects non-Azure resources into Azure for consistent management and governance."],
  ["m11", "mgmt", "Which service gives personalized recommendations on reliability, security, performance, cost and operational excellence?",
    "Azure Advisor", ["Azure Policy", "Azure Service Health", "Microsoft Defender for Cloud"],
    "Azure Advisor analyzes your resources and recommends best-practice improvements."],
  ["m12", "mgmt", "Which service informs you about Azure outages and planned maintenance that affect your resources?",
    "Azure Service Health", ["Azure Advisor", "Cost Management", "Azure Monitor metrics"],
    "Service Health gives personalized alerts and guidance when Azure issues impact you."],
  ["m13", "mgmt", "Which service collects and analyzes telemetry and lets you query logs with Kusto Query Language (KQL) in Log Analytics?",
    "Azure Monitor", ["Azure Policy", "Azure Migrate", "Azure DevOps"],
    "Azure Monitor gathers metrics and logs; Log Analytics is where you run KQL queries."],
  ["m14", "mgmt", "Which Azure capability lets you set spending thresholds and receive alerts when they are reached?",
    "Cost Management budgets", ["Resource locks", "Availability sets", "Azure Blueprints"],
    "Microsoft Cost Management lets you analyze spend and create budgets with alerts."],
];

const QUESTIONS = QUESTION_ROWS.map(([id, d, q, right, wrong, exp]) => ({ id, d, q, right, wrong, exp }));

const LEVELS = [
  [0, "Cloud Curious"], [100, "Portal Explorer"], [250, "Resource Grouper"], [450, "Region Hopper"],
  [700, "Policy Enforcer"], [1000, "Zero Trust Hero"], [1400, "Azure Ace"],
];