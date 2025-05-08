// src/graphql/schema.ts
import { gql } from 'apollo-server-micro';

export const typeDefs = gql`
 scalar DateTime
scalar Json
scalar Upload # Uncommented - Placeholder resolver will be added
scalar Date

# Add PageInfo type for Connections
type PageInfo {
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
  startCursor: String
  endCursor: String
}

# Connection type for Project
type ProjectEdge {
  node: Project!
  cursor: String!
}
type ProjectConnection {
  edges: [ProjectEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

# Connection type for Drawing
type DrawingEdge {
  node: Drawing!
  cursor: String!
}
type DrawingConnection {
  edges: [DrawingEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

# Connection type for Component
type ComponentEdge {
  node: Component!
  cursor: String!
}
type ComponentConnection {
  edges: [ComponentEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

# Connection type for Toolpath
type ToolpathEdge {
  node: Toolpath!
  cursor: String!
}
type ToolpathConnection {
  edges: [ToolpathEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

# Custom type for Organization Member data
type OrganizationMember {
  id: ID!
  name: String
  email: String
  image: String
  role: UserRole!
  joinedAt: DateTime!
}

type Query {
  # User queries
  me: User
  user(id: ID!): User
  users(skip: Int, take: Int): [User!]!
  userProjects: [Project!]! # Added from resolver
  userComponents: [Component!]! # Added from resolver
  userToolpaths: [Toolpath!]! # Added from resolver
  userOrganizations: [Organization!]! # Added from resolver
  
  # Organization queries
  organization(id: ID!): Organization
  organizations(skip: Int, take: Int): [Organization!]!
  myOrganizations: [Organization!]!
  organizationMembers(organizationId: ID!): [OrganizationMember!]! # Added from resolver
  organizationProjects(organizationId: ID!): [Project!]! # Added from resolver
  
  # Project queries
  project(id: ID!): Project
  # Use ProjectConnection to match resolver
  projects(first: Int, after: String, search: String, organizationId: ID): ProjectConnection!
  myProjects: [Project!]!
  
  # Drawing queries
  drawing(id: ID!): Drawing
  # Use DrawingConnection to match resolver
  drawings(projectId: ID!, first: Int, after: String, search: String): DrawingConnection!
  
  # Component queries
  component(id: ID!): Component
  # Use ComponentConnection to match resolver
  components(projectId: ID!, first: Int, after: String, search: String, type: String): ComponentConnection!
  publicComponents(skip: Int, take: Int): [Component!]!
  componentVersions(componentId: ID!): [ComponentVersion!]! # Added from resolver
  componentComments(componentId: ID!): [ComponentComment!]! # Added from resolver
  
  # Material queries
  material(id: ID!): Material
  materials(skip: Int, take: Int, organizationId: ID): [Material!]! # Note: Resolver for materials might use connection pattern, schema uses list
  publicMaterials(skip: Int, take: Int): [Material!]!
  
  # Tool queries
  tool(id: ID!): Tool
  tools(skip: Int, take: Int, organizationId: ID): [Tool!]! # Note: Resolver for tools might use connection pattern, schema uses list
  publicTools(skip: Int, take: Int): [Tool!]!
  
  # MachineConfig queries
  machineConfig(id: ID!): MachineConfig
  machineConfigs(skip: Int, take: Int): [MachineConfig!]! # Note: Resolver for machineConfigs might use connection pattern, schema uses list
  publicMachineConfigs(skip: Int, take: Int): [MachineConfig!]!
  
  # Library queries
  libraryItem(id: ID!): LibraryItem
  libraryItems(skip: Int, take: Int, category: String, type: String): [LibraryItem!]!
  publicLibraryItems(skip: Int, take: Int, category: String, type: String): [LibraryItem!]!
  
  # Conversation queries
  conversation(id: ID!): Conversation
  conversations(organizationId: ID!, skip: Int, take: Int): [Conversation!]!
  messages(conversationId: ID!, skip: Int, take: Int): [Message!]!
  
  # Notification queries
  notifications(isRead: Boolean, skip: Int, take: Int): [Notification!]!
  
  # Toolpath queries
  toolpath(id: ID!): Toolpath
  # Use ToolpathConnection to match resolver
  toolpaths(projectId: ID, drawingId: ID, first: Int, after: String, search: String, type: String, operationType: String): ToolpathConnection!
  toolpathVersions(toolpathId: ID!): [ToolpathVersion!]! # Added from resolver
  toolpathComments(toolpathId: ID!): [ToolpathComment!]! # Added from resolver
  
  # Subscription query
  subscription: Subscription # Refers to real-time Subscription type
  currentSubscription: BillingSubscription # Refers to BillingSubscription type
}

type Mutation {
  # User mutations
  updateUser(input: UpdateUserInput!): User!
  updatePassword(currentPassword: String!, newPassword: String!): Boolean!
  deleteUser: Boolean!
  updateProfile(name: String, email: String): User! # Added from resolver
  
  # Organization mutations
  createOrganization(input: CreateOrganizationInput!): Organization!
  updateOrganization(id: ID!, input: UpdateOrganizationInput!): Organization!
  deleteOrganization(id: ID!): Boolean!
  inviteToOrganization(input: InviteToOrganizationInput!): OrganizationInvitation!
  joinOrganization(token: String!): UserOrganization!
  updateUserRole(organizationId: ID!, userId: ID!, role: UserRole!): UserOrganization!
  removeUserFromOrganization(organizationId: ID!, userId: ID!): Boolean!
  updateOrganizationMember(organizationId: ID!, memberId: ID!, role: UserRole!): Boolean! # Added from resolver
  removeOrganizationMember(organizationId: ID!, memberId: ID!): Boolean! # Added from resolver
  
  # Project mutations
  createProject(input: CreateProjectInput!): Project!
  updateProject(id: ID!, input: UpdateProjectInput!): Project!
  deleteProject(id: ID!): Boolean!
  
  # Drawing mutations
  createDrawing(input: CreateDrawingInput!): Drawing!
  updateDrawing(id: ID!, input: UpdateDrawingInput!): Drawing!
  createDrawingVersion(drawingId: ID!, data: Json!): DrawingVersion!
  deleteDrawing(id: ID!): Boolean!
  
  # Component mutations
  createComponent(input: CreateComponentInput!): Component!
  updateComponent(id: ID!, input: UpdateComponentInput!): Component!
  addComponentComment(componentId: ID!, content: String!): ComponentComment!
  deleteComponent(id: ID!): Boolean!
  addComponentVersion(componentId: ID!, data: Json!, changeMessage: String): ComponentVersion!
  updateComponentComment(id: ID!, content: String!): ComponentComment!
  deleteComponentComment(id: ID!): Boolean!
  
  # Material mutations
  createMaterial(input: CreateMaterialInput!): Material!
  updateMaterial(id: ID!, input: UpdateMaterialInput!): Material!
  deleteMaterial(id: ID!): Boolean!
  
  # Tool mutations
  createTool(input: CreateToolInput!): Tool!
  updateTool(id: ID!, input: UpdateToolInput!): Tool!
  deleteTool(id: ID!): Boolean!
  
  # MachineConfig mutations
  createMachineConfig(input: CreateMachineConfigInput!): MachineConfig!
  updateMachineConfig(id: ID!, input: UpdateMachineConfigInput!): MachineConfig!
  deleteMachineConfig(id: ID!): Boolean!
  cloneMachineConfig(id: ID!, name: String): MachineConfig! # Added from resolver
  
  # Library mutations
  createLibraryItem(input: CreateLibraryItemInput!): LibraryItem!
  updateLibraryItem(id: ID!, input: UpdateLibraryItemInput!): LibraryItem!
  deleteLibraryItem(id: ID!): Boolean!
  
  # File mutations
  uploadFile(file: Upload!, objectId: ID, objectType: String): FileUpload! # Changed back to Upload! - Note: Scalar Upload is commented out above
  deleteFile(id: ID!): Boolean!
  
  # Conversation mutations
  createConversation(input: CreateConversationInput!): Conversation!
  addParticipant(conversationId: ID!, userId: ID!): ConversationParticipant!
  removeParticipant(conversationId: ID!, userId: ID!): Boolean!
  sendMessage(input: SendMessageInput!): Message!
  markConversationAsRead(conversationId: ID!): Boolean!
  
  # Notification mutations
  markNotificationAsRead(id: ID!): Notification!
  markAllNotificationsAsRead: Boolean!
  
  # Subscription mutations
  updateSubscription(plan: String!): BillingSubscription! 
  cancelSubscription: Boolean!
  createCheckoutSession(priceId: String!, successUrl: String!, cancelUrl: String!): String!
  
  # Push subscription
  subscribeToPushNotifications(endpoint: String!, p256dh: String!, auth: String!): PushSubscription!
  unsubscribeFromPushNotifications(endpoint: String!): Boolean!
  
  # Toolpath mutations
  createToolpath(input: CreateToolpathInput!): Toolpath!
  updateToolpath(id: ID!, input: UpdateToolpathInput!): Toolpath!
  addToolpathComment(toolpathId: ID!, content: String!): ToolpathComment!
  deleteToolpath(id: ID!): Boolean!
  addToolpathVersion(toolpathId: ID!, data: Json, gcode: String, changeMessage: String): ToolpathVersion!
  restoreToolpathVersion(toolpathId: ID!, versionId: ID!): Toolpath!
  updateToolpathComment(id: ID!, content: String!): ToolpathComment!
  deleteToolpathComment(id: ID!): Boolean!
  
  # User account deletion
  deleteAccount: Boolean! # Added from resolver
}

type Subscription { # Type for real-time updates
  notificationAdded: Notification!
  messageAdded(conversationId: ID!): Message!
}

# Types based on Prisma schema
type User {
  id: ID!
  name: String
  email: String
  emailVerified: DateTime
  image: String
  createdAt: DateTime!
  updatedAt: DateTime!
  
  organizations: [UserOrganization!]!
  projects: [Project!]!
  components: [Component!]!
  toolpaths: [Toolpath!]!
  materials: [Material!]!
  tools: [Tool!]!
  machineConfigs: [MachineConfig!]!
  libraryItems: [LibraryItem!]!
  subscription: BillingSubscription # Changed to BillingSubscription
  conversations: [ConversationParticipant!]!
  notifications: [Notification!]!
  pushSubscriptions: [PushSubscription!]!
}

# Renamed from Subscription to avoid conflict
type BillingSubscription { 
  id: ID!
  userId: ID!
  plan: String!
  status: String!
  stripeCustomerId: String
  stripeSubscriptionId: String
  stripePriceId: String
  stripeCurrentPeriodEnd: DateTime
  lsCustomerId: String
  lsSubscriptionId: String
  lsVariantId: String
  lsCurrentPeriodEnd: DateTime
  cancelAtPeriodEnd: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  user: User!
}

type Organization {
  id: ID!
  name: String!
  description: String
  createdAt: DateTime!
  updatedAt: DateTime!
  
  users: [UserOrganization!]!
  members: [OrganizationMember!]! # Added from resolver
  projects: [Project!]!
  invitations: [OrganizationInvitation!]!
  materials: [Material!]!
  tools: [Tool!]!
  libraryItems: [LibraryItem!]!
  conversations: [Conversation!]!
  notifications: [Notification!]!
}

type OrganizationInvitation {
  id: ID!
  email: String!
  role: UserRole!
  token: String!
  organizationId: ID!
  createdAt: DateTime!
  expiresAt: DateTime!
  
  organization: Organization!
}

type UserOrganization {
  id: ID!
  userId: ID!
  organizationId: ID!
  role: UserRole!
  joinedAt: DateTime!
  
  user: User!
  organization: Organization!
}

enum UserRole {
  ADMIN
  MANAGER
  MEMBER
}

type Project {
  id: ID!
  name: String!
  description: String
  createdAt: DateTime!
  updatedAt: DateTime!
  ownerId: ID!
  organizationId: ID
  isPublic: Boolean!
  drawingCount: Int!
  componentCount: Int!
  
  owner: User!
  organization: Organization
  drawings: [Drawing!]!
  components: [Component!]!
  toolpaths: [Toolpath!]!
}

type Drawing {
  id: ID!
  name: String!
  description: String
  data: Json!
  thumbnail: String
  createdAt: DateTime!
  updatedAt: DateTime!
  projectId: ID!
  
  project: Project!
  versions: [DrawingVersion!]!
  toolpaths: [Toolpath!]!
}

type DrawingVersion {
  id: ID!
  version: Int!
  data: Json!
  createdAt: DateTime!
  drawingId: ID!
  
  drawing: Drawing!
}

type Component {
  id: ID!
  name: String!
  description: String
  data: Json!
  thumbnail: String
  type: String
  isPublic: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  projectId: ID!
  
  project: Project!
  versions: [ComponentVersion!]!
  comments: [ComponentComment!]!
}

type ComponentVersion {
  id: ID!
  componentId: ID!
  data: Json!
  changeMessage: String
  userId: ID!
  createdAt: DateTime!
  
  component: Component!
  user: User!
}

type ComponentComment {
  id: ID!
  componentId: ID!
  content: String!
  userId: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  component: Component!
  user: User!
}

type Material {
  id: ID!
  name: String!
  description: String
  properties: Json!
  isPublic: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  ownerId: ID
  organizationId: ID
  
  owner: User
  organization: Organization
  toolpaths: [Toolpath!]!
}

type Tool {
  id: ID!
  name: String!
  type: String!
  diameter: Float!
  material: String!
  numberOfFlutes: Int
  maxRPM: Int
  coolantType: String
  cuttingLength: Float
  totalLength: Float
  shankDiameter: Float
  notes: String
  isPublic: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  ownerId: ID
  organizationId: ID
  
  owner: User
  organization: Organization
  toolpaths: [Toolpath!]!
}

type Toolpath {
  id: ID!
  name: String!
  description: String
  data: Json
  type: String
  operationType: String
  gcode: String
  thumbnail: String
  isPublic: Boolean!
  projectId: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  createdBy: ID!
  drawingId: ID
  materialId: ID
  toolId: ID
  machineConfigId: ID
  
  project: Project!
  user: User!
  versions: [ToolpathVersion!]!
  comments: [ToolpathComment!]!
  drawing: Drawing
  material: Material
  tool: Tool
  machineConfig: MachineConfig
}

type ToolpathVersion {
  id: ID!
  toolpathId: ID!
  data: Json
  gcode: String
  changeMessage: String
  userId: ID!
  createdAt: DateTime!
  
  toolpath: Toolpath!
  user: User!
}

type ToolpathComment {
  id: ID!
  toolpathId: ID!
  content: String!
  userId: ID!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  toolpath: Toolpath!
  user: User!
}

type MachineConfig {
  id: ID!
  name: String!
  type: String!
  description: String
  config: Json!
  isPublic: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  ownerId: ID!
  
  owner: User!
  organization: Organization # Added this field
  toolpaths: [Toolpath!]!
}

type ActivityLog {
  id: ID!
  userId: ID!
  itemId: ID!
  itemType: String!
  action: String!
  details: Json
  timestamp: DateTime!
  
  user: User!
}

type AIAnalysisLog {
  id: ID!
  userId: ID!
  objectId: ID!
  objectType: String!
  analysisType: String!
  result: Json!
  createdAt: DateTime!
  
  user: User!
}

type FileUpload {
  id: ID!
  fileName: String!
  s3Key: String!
  s3Bucket: String!
  s3ContentType: String!
  s3Size: Int!
  objectId: ID
  objectType: String
  ownerId: ID!
  organizationId: ID
  createdAt: DateTime!
  updatedAt: DateTime!
  
  messages: [Message!]!
}

type LibraryItem {
  id: ID!
  name: String!
  description: String
  category: String!
  type: String!
  data: Json!
  properties: Json
  tags: [String!]!
  thumbnail: String
  isPublic: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  ownerId: ID
  organizationId: ID
  
  owner: User
  organization: Organization
}

type Conversation {
  id: ID!
  name: String
  organizationId: ID!
  isGroupChat: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  
  organization: Organization!
  participants: [ConversationParticipant!]!
  messages: [Message!]!
}

type ConversationParticipant {
  id: ID!
  userId: ID!
  conversationId: ID!
  joinedAt: DateTime!
  lastReadAt: DateTime
  
  user: User!
  conversation: Conversation!
}

type Message {
  id: ID!
  content: String!
  senderId: ID!
  conversationId: ID!
  fileId: ID
  fileUrl: String
  createdAt: DateTime!
  updatedAt: DateTime!
  
  sender: User!
  conversation: Conversation!
  notifications: [Notification!]!
  fileUpload: FileUpload
}

type Notification {
  id: ID!
  type: NotificationType!
  title: String!
  content: String!
  isRead: Boolean!
  createdAt: DateTime!
  userId: ID!
  organizationId: ID
  projectId: ID
  componentId: ID
  messageId: ID
  linkUrl: String
  
  user: User!
  organization: Organization
  project: Project
  component: Component
  message: Message
}

enum NotificationType {
  NEW_MESSAGE
  PROJECT_CREATED
  COMPONENT_CREATED
  MEMBER_JOINED
  ORGANIZATION_INVITATION
}

type PushSubscription {
  id: ID!
  userId: ID!
  endpoint: String!
  p256dh: String!
  auth: String!
  createdAt: DateTime!
  
  user: User!
}

type Token {
  id: ID!
  token: String!
  type: String!
  expiresAt: DateTime!
  userId: ID!
  metadata: Json
  createdAt: DateTime!
  updatedAt: DateTime!
}

type PluginRegistryEntry {
  id: ID!
  manifestJson: String!
  state: String!
  enabled: Boolean!
  version: String!
  installedAt: DateTime!
  updatedAt: DateTime!
  errorCount: Int!
  lastError: String
  
  configuration: PluginConfiguration
}

type PluginConfiguration {
  pluginId: ID!
  configJson: String!
  
  plugin: PluginRegistryEntry!
}

# Input types
input UpdateUserInput {
  name: String
  email: String
  image: String
}

input CreateOrganizationInput {
  name: String!
  description: String
}

input UpdateOrganizationInput {
  name: String
  description: String
}

input InviteToOrganizationInput {
  organizationId: ID!
  email: String!
  role: UserRole!
}

input CreateProjectInput {
  name: String!
  description: String
  organizationId: ID
  isPublic: Boolean
}

input UpdateProjectInput {
  name: String
  description: String
  organizationId: ID
  isPublic: Boolean
}

input CreateDrawingInput {
  name: String!
  description: String
  data: Json!
  thumbnail: String
  projectId: ID!
}

input UpdateDrawingInput {
  name: String
  description: String
  data: Json
  thumbnail: String
}

input CreateComponentInput {
  name: String!
  description: String
  data: Json!
  thumbnail: String
  type: String
  isPublic: Boolean
  projectId: ID!
}

input UpdateComponentInput {
  name: String
  description: String
  data: Json
  thumbnail: String
  type: String
  isPublic: Boolean
}

input CreateMaterialInput {
  name: String!
  description: String
  properties: Json!
  isPublic: Boolean
  organizationId: ID
}

input UpdateMaterialInput {
  name: String
  description: String
  properties: Json
  isPublic: Boolean
  organizationId: ID
}

input CreateToolInput {
  name: String!
  type: String!
  diameter: Float!
  material: String!
  numberOfFlutes: Int
  maxRPM: Int
  coolantType: String
  cuttingLength: Float
  totalLength: Float
  shankDiameter: Float
  notes: String
  isPublic: Boolean
  organizationId: ID
}

input UpdateToolInput {
  name: String
  type: String
  diameter: Float
  material: String
  numberOfFlutes: Int
  maxRPM: Int
  coolantType: String
  cuttingLength: Float
  totalLength: Float
  shankDiameter: Float
  notes: String
  isPublic: Boolean
  organizationId: ID
}

input CreateMachineConfigInput {
  name: String!
  type: String!
  description: String
  config: Json!
  isPublic: Boolean
}

input UpdateMachineConfigInput {
  name: String
  type: String
  description: String
  config: Json
  isPublic: Boolean
}

input CreateLibraryItemInput {
  name: String!
  description: String
  category: String!
  type: String!
  data: Json!
  properties: Json
  tags: [String!]
  thumbnail: String
  isPublic: Boolean
  organizationId: ID
}

input UpdateLibraryItemInput {
  name: String
  description: String
  category: String
  type: String
  data: Json
  properties: Json
  tags: [String!]
  thumbnail: String
  isPublic: Boolean
  organizationId: ID
}

input CreateConversationInput {
  name: String
  organizationId: ID!
  isGroupChat: Boolean
  participantIds: [ID!]!
}

input SendMessageInput {
  content: String!
  conversationId: ID!
  fileId: ID
}

input CreateToolpathInput {
  name: String!
  description: String
  data: Json
  type: String
  operationType: String
  gcode: String
  thumbnail: String
  isPublic: Boolean
  projectId: ID!
  drawingId: ID
  materialId: ID
  toolId: ID
  machineConfigId: ID
}

input UpdateToolpathInput {
  name: String
  description: String
  data: Json
  type: String
  operationType: String
  gcode: String
  thumbnail: String
  isPublic: Boolean
  drawingId: ID
  materialId: ID
  toolId: ID
  machineConfigId: ID
}
`;
export default typeDefs
