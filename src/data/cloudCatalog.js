// ─── Multi-cloud Service Catalog ─────────────────────────────────────
//
// Capability → equivalent managed service on each provider. Drives service
// suggestions in the component form and the "equivalents" hint in the
// detail panel, so a design can be compared across clouds quickly.

export const PROVIDERS = ["Azure", "AWS", "GCP", "On-prem", "SaaS"];

export const PROVIDER_COLORS = {
  Azure: "bg-blue-100 text-blue-800",
  AWS: "bg-orange-100 text-orange-800",
  GCP: "bg-green-100 text-green-800",
  "On-prem": "bg-gray-200 text-gray-700",
  SaaS: "bg-purple-100 text-purple-800",
};

export const LAYERS = [
  "Edge & Network",
  "Identity",
  "Security",
  "Compute",
  "Data",
  "Integration",
  "Observability",
  "DevOps",
];

export const CATALOG = [
  { capability: "Virtual network", layer: "Edge & Network", Azure: "Virtual Network", AWS: "Amazon VPC", GCP: "VPC Network" },
  { capability: "Global load balancer / CDN", layer: "Edge & Network", Azure: "Azure Front Door", AWS: "Amazon CloudFront", GCP: "Cloud CDN + Global LB" },
  { capability: "Regional load balancer", layer: "Edge & Network", Azure: "Application Gateway", AWS: "Application Load Balancer", GCP: "Cloud Load Balancing" },
  { capability: "Private connectivity", layer: "Edge & Network", Azure: "ExpressRoute", AWS: "Direct Connect", GCP: "Cloud Interconnect" },
  { capability: "DNS", layer: "Edge & Network", Azure: "Azure DNS", AWS: "Route 53", GCP: "Cloud DNS" },
  { capability: "Workforce identity", layer: "Identity", Azure: "Microsoft Entra ID", AWS: "IAM Identity Center", GCP: "Cloud Identity" },
  { capability: "Customer identity", layer: "Identity", Azure: "Entra External ID", AWS: "Amazon Cognito", GCP: "Identity Platform" },
  { capability: "Secrets & keys", layer: "Security", Azure: "Key Vault", AWS: "AWS KMS + Secrets Manager", GCP: "Cloud KMS + Secret Manager" },
  { capability: "Web application firewall", layer: "Security", Azure: "Azure WAF", AWS: "AWS WAF", GCP: "Cloud Armor" },
  { capability: "Security posture", layer: "Security", Azure: "Defender for Cloud", AWS: "Security Hub + GuardDuty", GCP: "Security Command Center" },
  { capability: "Managed Kubernetes", layer: "Compute", Azure: "AKS", AWS: "Amazon EKS", GCP: "GKE" },
  { capability: "Serverless containers", layer: "Compute", Azure: "Container Apps", AWS: "AWS Fargate / App Runner", GCP: "Cloud Run" },
  { capability: "Functions", layer: "Compute", Azure: "Azure Functions", AWS: "AWS Lambda", GCP: "Cloud Functions" },
  { capability: "Virtual machines", layer: "Compute", Azure: "Virtual Machines", AWS: "Amazon EC2", GCP: "Compute Engine" },
  { capability: "Web app hosting (PaaS)", layer: "Compute", Azure: "App Service", AWS: "Elastic Beanstalk", GCP: "App Engine" },
  { capability: "Relational database", layer: "Data", Azure: "Azure SQL / PostgreSQL Flexible", AWS: "Amazon RDS / Aurora", GCP: "Cloud SQL / AlloyDB" },
  { capability: "NoSQL document DB", layer: "Data", Azure: "Cosmos DB", AWS: "DynamoDB", GCP: "Firestore" },
  { capability: "Object storage", layer: "Data", Azure: "Blob Storage", AWS: "Amazon S3", GCP: "Cloud Storage" },
  { capability: "Cache", layer: "Data", Azure: "Azure Cache for Redis", AWS: "ElastiCache", GCP: "Memorystore" },
  { capability: "Data warehouse", layer: "Data", Azure: "Microsoft Fabric / Synapse", AWS: "Amazon Redshift", GCP: "BigQuery" },
  { capability: "Message queue", layer: "Integration", Azure: "Service Bus", AWS: "Amazon SQS / SNS", GCP: "Pub/Sub" },
  { capability: "Event streaming", layer: "Integration", Azure: "Event Hubs", AWS: "Amazon Kinesis / MSK", GCP: "Pub/Sub / Managed Kafka" },
  { capability: "API gateway", layer: "Integration", Azure: "API Management", AWS: "Amazon API Gateway", GCP: "Apigee / API Gateway" },
  { capability: "Workflow orchestration", layer: "Integration", Azure: "Logic Apps / Durable Functions", AWS: "Step Functions", GCP: "Workflows" },
  { capability: "Metrics & logs", layer: "Observability", Azure: "Azure Monitor + Log Analytics", AWS: "CloudWatch", GCP: "Cloud Monitoring + Logging" },
  { capability: "Distributed tracing", layer: "Observability", Azure: "Application Insights", AWS: "AWS X-Ray", GCP: "Cloud Trace" },
  { capability: "CI/CD", layer: "DevOps", Azure: "Azure DevOps / GitHub Actions", AWS: "CodePipeline / GitHub Actions", GCP: "Cloud Build / GitHub Actions" },
  { capability: "Infrastructure as code", layer: "DevOps", Azure: "Bicep / Terraform", AWS: "CloudFormation / CDK / Terraform", GCP: "Terraform / Infra Manager" },
  { capability: "Container registry", layer: "DevOps", Azure: "Azure Container Registry", AWS: "Amazon ECR", GCP: "Artifact Registry" },
];

// Services offered for a provider + layer (used as form suggestions).
export function suggestServices(provider, layer) {
  return CATALOG
    .filter((row) => (!layer || row.layer === layer) && row[provider])
    .map((row) => row[provider]);
}

// Find the catalog row a free-text service name belongs to.
export function findCapability(service) {
  if (!service || service.trim().length < 3) return null;
  const s = service.trim().toLowerCase();
  return CATALOG.find((row) =>
    ["Azure", "AWS", "GCP"].some((p) =>
      row[p].toLowerCase().split(/\s*[/+]\s*/).some((name) => name && (s.includes(name) || name.includes(s)))
    )
  ) || null;
}
