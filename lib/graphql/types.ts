import { gql } from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: any; output: any; }
  Json: { input: any; output: any; }
  Upload: { input: any; output: any; }
};

export type AiAnalysisLog = {
  __typename?: 'AIAnalysisLog';
  analysisType: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  objectId: Scalars['ID']['output'];
  objectType: Scalars['String']['output'];
  result: Scalars['Json']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type ActivityLog = {
  __typename?: 'ActivityLog';
  action: Scalars['String']['output'];
  details: Maybe<Scalars['Json']['output']>;
  id: Scalars['ID']['output'];
  itemId: Scalars['ID']['output'];
  itemType: Scalars['String']['output'];
  timestamp: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type Component = {
  __typename?: 'Component';
  comments: Array<ComponentComment>;
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['Json']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['ID']['output'];
  thumbnail: Maybe<Scalars['String']['output']>;
  type: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  versions: Array<ComponentVersion>;
};

export type ComponentComment = {
  __typename?: 'ComponentComment';
  component: Component;
  componentId: Scalars['ID']['output'];
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type ComponentVersion = {
  __typename?: 'ComponentVersion';
  changeMessage: Maybe<Scalars['String']['output']>;
  component: Component;
  componentId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['Json']['output'];
  id: Scalars['ID']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type Conversation = {
  __typename?: 'Conversation';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isGroupChat: Scalars['Boolean']['output'];
  messages: Array<Message>;
  name: Maybe<Scalars['String']['output']>;
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  participants: Array<ConversationParticipant>;
  updatedAt: Scalars['DateTime']['output'];
};

export type ConversationParticipant = {
  __typename?: 'ConversationParticipant';
  conversation: Conversation;
  conversationId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  joinedAt: Scalars['DateTime']['output'];
  lastReadAt: Maybe<Scalars['DateTime']['output']>;
  user: User;
  userId: Scalars['ID']['output'];
};

export type CreateComponentInput = {
  data: Scalars['Json']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
  thumbnail: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type CreateConversationInput = {
  isGroupChat: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  organizationId: Scalars['ID']['input'];
  participantIds: Array<Scalars['ID']['input']>;
};

export type CreateDrawingInput = {
  data: Scalars['Json']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  projectId: Scalars['ID']['input'];
  thumbnail: InputMaybe<Scalars['String']['input']>;
};

export type CreateLibraryItemInput = {
  category: Scalars['String']['input'];
  data: Scalars['Json']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  organizationId: InputMaybe<Scalars['ID']['input']>;
  properties: InputMaybe<Scalars['Json']['input']>;
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  thumbnail: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
};

export type CreateMachineConfigInput = {
  config: Scalars['Json']['input'];
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type CreateMaterialInput = {
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  organizationId: InputMaybe<Scalars['ID']['input']>;
  properties: Scalars['Json']['input'];
};

export type CreateOrganizationInput = {
  description: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
};

export type CreateProjectInput = {
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  organizationId: InputMaybe<Scalars['ID']['input']>;
};

export type CreateToolInput = {
  coolantType: InputMaybe<Scalars['String']['input']>;
  cuttingLength: InputMaybe<Scalars['Float']['input']>;
  diameter: Scalars['Float']['input'];
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  material: Scalars['String']['input'];
  maxRPM: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  notes: InputMaybe<Scalars['String']['input']>;
  numberOfFlutes: InputMaybe<Scalars['Int']['input']>;
  organizationId: InputMaybe<Scalars['ID']['input']>;
  shankDiameter: InputMaybe<Scalars['Float']['input']>;
  totalLength: InputMaybe<Scalars['Float']['input']>;
  type: Scalars['String']['input'];
};

export type CreateToolpathInput = {
  data: InputMaybe<Scalars['Json']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  drawingId: InputMaybe<Scalars['ID']['input']>;
  gcode: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  machineConfigId: InputMaybe<Scalars['ID']['input']>;
  materialId: InputMaybe<Scalars['ID']['input']>;
  name: Scalars['String']['input'];
  operationType: InputMaybe<Scalars['String']['input']>;
  projectId: Scalars['ID']['input'];
  thumbnail: InputMaybe<Scalars['String']['input']>;
  toolId: InputMaybe<Scalars['ID']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type Drawing = {
  __typename?: 'Drawing';
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['Json']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  project: Project;
  projectId: Scalars['ID']['output'];
  thumbnail: Maybe<Scalars['String']['output']>;
  toolpaths: Array<Toolpath>;
  updatedAt: Scalars['DateTime']['output'];
  versions: Array<DrawingVersion>;
};

export type DrawingVersion = {
  __typename?: 'DrawingVersion';
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['Json']['output'];
  drawing: Drawing;
  drawingId: Scalars['ID']['output'];
  id: Scalars['ID']['output'];
  version: Scalars['Int']['output'];
};

export type FileUpload = {
  __typename?: 'FileUpload';
  createdAt: Scalars['DateTime']['output'];
  fileName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  messages: Array<Message>;
  objectId: Maybe<Scalars['ID']['output']>;
  objectType: Maybe<Scalars['String']['output']>;
  organizationId: Maybe<Scalars['ID']['output']>;
  ownerId: Scalars['ID']['output'];
  s3Bucket: Scalars['String']['output'];
  s3ContentType: Scalars['String']['output'];
  s3Key: Scalars['String']['output'];
  s3Size: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type InviteToOrganizationInput = {
  email: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  role: UserRole;
};

export type LibraryItem = {
  __typename?: 'LibraryItem';
  category: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  data: Scalars['Json']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization: Maybe<Organization>;
  organizationId: Maybe<Scalars['ID']['output']>;
  owner: Maybe<User>;
  ownerId: Maybe<Scalars['ID']['output']>;
  properties: Maybe<Scalars['Json']['output']>;
  tags: Array<Scalars['String']['output']>;
  thumbnail: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type MachineConfig = {
  __typename?: 'MachineConfig';
  config: Scalars['Json']['output'];
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  owner: User;
  ownerId: Scalars['ID']['output'];
  toolpaths: Array<Toolpath>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Material = {
  __typename?: 'Material';
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization: Maybe<Organization>;
  organizationId: Maybe<Scalars['ID']['output']>;
  owner: Maybe<User>;
  ownerId: Maybe<Scalars['ID']['output']>;
  properties: Scalars['Json']['output'];
  toolpaths: Array<Toolpath>;
  updatedAt: Scalars['DateTime']['output'];
};

export type Message = {
  __typename?: 'Message';
  content: Scalars['String']['output'];
  conversation: Conversation;
  conversationId: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  fileId: Maybe<Scalars['ID']['output']>;
  fileUpload: Maybe<FileUpload>;
  fileUrl: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  notifications: Array<Notification>;
  sender: User;
  senderId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  addComponentComment: ComponentComment;
  addParticipant: ConversationParticipant;
  addToolpathComment: ToolpathComment;
  cancelSubscription: Scalars['Boolean']['output'];
  createComponent: Component;
  createComponentVersion: ComponentVersion;
  createConversation: Conversation;
  createDrawing: Drawing;
  createDrawingVersion: DrawingVersion;
  createLibraryItem: LibraryItem;
  createMachineConfig: MachineConfig;
  createMaterial: Material;
  createOrganization: Organization;
  createProject: Project;
  createTool: Tool;
  createToolpath: Toolpath;
  createToolpathVersion: ToolpathVersion;
  deleteComponent: Scalars['Boolean']['output'];
  deleteDrawing: Scalars['Boolean']['output'];
  deleteFile: Scalars['Boolean']['output'];
  deleteLibraryItem: Scalars['Boolean']['output'];
  deleteMachineConfig: Scalars['Boolean']['output'];
  deleteMaterial: Scalars['Boolean']['output'];
  deleteOrganization: Scalars['Boolean']['output'];
  deleteProject: Scalars['Boolean']['output'];
  deleteTool: Scalars['Boolean']['output'];
  deleteToolpath: Scalars['Boolean']['output'];
  deleteUser: Scalars['Boolean']['output'];
  inviteToOrganization: OrganizationInvitation;
  joinOrganization: UserOrganization;
  markAllNotificationsAsRead: Scalars['Boolean']['output'];
  markConversationAsRead: Scalars['Boolean']['output'];
  markNotificationAsRead: Notification;
  removeParticipant: Scalars['Boolean']['output'];
  removeUserFromOrganization: Scalars['Boolean']['output'];
  sendMessage: Message;
  subscribeToPushNotifications: PushSubscription;
  unsubscribeFromPushNotifications: Scalars['Boolean']['output'];
  updateComponent: Component;
  updateDrawing: Drawing;
  updateLibraryItem: LibraryItem;
  updateMachineConfig: MachineConfig;
  updateMaterial: Material;
  updateOrganization: Organization;
  updatePassword: Scalars['Boolean']['output'];
  updateProject: Project;
  updateSubscription: Subscription;
  updateTool: Tool;
  updateToolpath: Toolpath;
  updateUser: User;
  updateUserRole: UserOrganization;
  uploadFile: FileUpload;
};


export type MutationAddComponentCommentArgs = {
  componentId: Scalars['ID']['input'];
  content: Scalars['String']['input'];
};


export type MutationAddParticipantArgs = {
  conversationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationAddToolpathCommentArgs = {
  content: Scalars['String']['input'];
  toolpathId: Scalars['ID']['input'];
};


export type MutationCreateComponentArgs = {
  input: CreateComponentInput;
};


export type MutationCreateComponentVersionArgs = {
  changeMessage: InputMaybe<Scalars['String']['input']>;
  componentId: Scalars['ID']['input'];
  data: Scalars['Json']['input'];
};


export type MutationCreateConversationArgs = {
  input: CreateConversationInput;
};


export type MutationCreateDrawingArgs = {
  input: CreateDrawingInput;
};


export type MutationCreateDrawingVersionArgs = {
  data: Scalars['Json']['input'];
  drawingId: Scalars['ID']['input'];
};


export type MutationCreateLibraryItemArgs = {
  input: CreateLibraryItemInput;
};


export type MutationCreateMachineConfigArgs = {
  input: CreateMachineConfigInput;
};


export type MutationCreateMaterialArgs = {
  input: CreateMaterialInput;
};


export type MutationCreateOrganizationArgs = {
  input: CreateOrganizationInput;
};


export type MutationCreateProjectArgs = {
  input: CreateProjectInput;
};


export type MutationCreateToolArgs = {
  input: CreateToolInput;
};


export type MutationCreateToolpathArgs = {
  input: CreateToolpathInput;
};


export type MutationCreateToolpathVersionArgs = {
  changeMessage: InputMaybe<Scalars['String']['input']>;
  data: Scalars['Json']['input'];
  gcode: InputMaybe<Scalars['String']['input']>;
  toolpathId: Scalars['ID']['input'];
};


export type MutationDeleteComponentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDrawingArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteFileArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteLibraryItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMachineConfigArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteMaterialArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteOrganizationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteProjectArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteToolArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteToolpathArgs = {
  id: Scalars['ID']['input'];
};


export type MutationInviteToOrganizationArgs = {
  input: InviteToOrganizationInput;
};


export type MutationJoinOrganizationArgs = {
  token: Scalars['String']['input'];
};


export type MutationMarkConversationAsReadArgs = {
  conversationId: Scalars['ID']['input'];
};


export type MutationMarkNotificationAsReadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveParticipantArgs = {
  conversationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationRemoveUserFromOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationSendMessageArgs = {
  input: SendMessageInput;
};


export type MutationSubscribeToPushNotificationsArgs = {
  auth: Scalars['String']['input'];
  endpoint: Scalars['String']['input'];
  p256dh: Scalars['String']['input'];
};


export type MutationUnsubscribeFromPushNotificationsArgs = {
  endpoint: Scalars['String']['input'];
};


export type MutationUpdateComponentArgs = {
  id: Scalars['ID']['input'];
  input: UpdateComponentInput;
};


export type MutationUpdateDrawingArgs = {
  id: Scalars['ID']['input'];
  input: UpdateDrawingInput;
};


export type MutationUpdateLibraryItemArgs = {
  id: Scalars['ID']['input'];
  input: UpdateLibraryItemInput;
};


export type MutationUpdateMachineConfigArgs = {
  id: Scalars['ID']['input'];
  input: UpdateMachineConfigInput;
};


export type MutationUpdateMaterialArgs = {
  id: Scalars['ID']['input'];
  input: UpdateMaterialInput;
};


export type MutationUpdateOrganizationArgs = {
  id: Scalars['ID']['input'];
  input: UpdateOrganizationInput;
};


export type MutationUpdatePasswordArgs = {
  currentPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
};


export type MutationUpdateProjectArgs = {
  id: Scalars['ID']['input'];
  input: UpdateProjectInput;
};


export type MutationUpdateSubscriptionArgs = {
  plan: Scalars['String']['input'];
};


export type MutationUpdateToolArgs = {
  id: Scalars['ID']['input'];
  input: UpdateToolInput;
};


export type MutationUpdateToolpathArgs = {
  id: Scalars['ID']['input'];
  input: UpdateToolpathInput;
};


export type MutationUpdateUserArgs = {
  input: UpdateUserInput;
};


export type MutationUpdateUserRoleArgs = {
  organizationId: Scalars['ID']['input'];
  role: UserRole;
  userId: Scalars['ID']['input'];
};


export type MutationUploadFileArgs = {
  file: Scalars['Upload']['input'];
  objectId: InputMaybe<Scalars['ID']['input']>;
  objectType: InputMaybe<Scalars['String']['input']>;
};

export type Notification = {
  __typename?: 'Notification';
  component: Maybe<Component>;
  componentId: Maybe<Scalars['ID']['output']>;
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  isRead: Scalars['Boolean']['output'];
  linkUrl: Maybe<Scalars['String']['output']>;
  message: Maybe<Message>;
  messageId: Maybe<Scalars['ID']['output']>;
  organization: Maybe<Organization>;
  organizationId: Maybe<Scalars['ID']['output']>;
  project: Maybe<Project>;
  projectId: Maybe<Scalars['ID']['output']>;
  title: Scalars['String']['output'];
  type: NotificationType;
  user: User;
  userId: Scalars['ID']['output'];
};

export enum NotificationType {
  ComponentCreated = 'COMPONENT_CREATED',
  MemberJoined = 'MEMBER_JOINED',
  NewMessage = 'NEW_MESSAGE',
  OrganizationInvitation = 'ORGANIZATION_INVITATION',
  ProjectCreated = 'PROJECT_CREATED'
}

export type Organization = {
  __typename?: 'Organization';
  conversations: Array<Conversation>;
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  invitations: Array<OrganizationInvitation>;
  libraryItems: Array<LibraryItem>;
  materials: Array<Material>;
  name: Scalars['String']['output'];
  notifications: Array<Notification>;
  projects: Array<Project>;
  tools: Array<Tool>;
  updatedAt: Scalars['DateTime']['output'];
  users: Array<UserOrganization>;
};

export type OrganizationInvitation = {
  __typename?: 'OrganizationInvitation';
  createdAt: Scalars['DateTime']['output'];
  email: Scalars['String']['output'];
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  role: UserRole;
  token: Scalars['String']['output'];
};

export type PluginConfiguration = {
  __typename?: 'PluginConfiguration';
  configJson: Scalars['String']['output'];
  plugin: PluginRegistryEntry;
  pluginId: Scalars['ID']['output'];
};

export type PluginRegistryEntry = {
  __typename?: 'PluginRegistryEntry';
  configuration: Maybe<PluginConfiguration>;
  enabled: Scalars['Boolean']['output'];
  errorCount: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  installedAt: Scalars['DateTime']['output'];
  lastError: Maybe<Scalars['String']['output']>;
  manifestJson: Scalars['String']['output'];
  state: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  version: Scalars['String']['output'];
};

export type Project = {
  __typename?: 'Project';
  components: Array<Component>;
  createdAt: Scalars['DateTime']['output'];
  description: Maybe<Scalars['String']['output']>;
  drawings: Array<Drawing>;
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization: Maybe<Organization>;
  organizationId: Maybe<Scalars['ID']['output']>;
  owner: User;
  ownerId: Scalars['ID']['output'];
  toolpaths: Array<Toolpath>;
  updatedAt: Scalars['DateTime']['output'];
};

export type PushSubscription = {
  __typename?: 'PushSubscription';
  auth: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  endpoint: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  p256dh: Scalars['String']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type Query = {
  __typename?: 'Query';
  component: Maybe<Component>;
  components: Array<Component>;
  conversation: Maybe<Conversation>;
  conversations: Array<Conversation>;
  drawing: Maybe<Drawing>;
  drawings: Array<Drawing>;
  libraryItem: Maybe<LibraryItem>;
  libraryItems: Array<LibraryItem>;
  machineConfig: Maybe<MachineConfig>;
  machineConfigs: Array<MachineConfig>;
  material: Maybe<Material>;
  materials: Array<Material>;
  me: Maybe<User>;
  messages: Array<Message>;
  myOrganizations: Array<Organization>;
  myProjects: Array<Project>;
  notifications: Array<Notification>;
  organization: Maybe<Organization>;
  organizations: Array<Organization>;
  project: Maybe<Project>;
  projects: Array<Project>;
  publicComponents: Array<Component>;
  publicLibraryItems: Array<LibraryItem>;
  publicMachineConfigs: Array<MachineConfig>;
  publicMaterials: Array<Material>;
  publicTools: Array<Tool>;
  subscription: Maybe<Subscription>;
  tool: Maybe<Tool>;
  toolpath: Maybe<Toolpath>;
  toolpaths: Array<Toolpath>;
  tools: Array<Tool>;
  user: Maybe<User>;
  users: Array<User>;
};


export type QueryComponentArgs = {
  id: Scalars['ID']['input'];
};


export type QueryComponentsArgs = {
  projectId: Scalars['ID']['input'];
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryConversationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryConversationsArgs = {
  organizationId: Scalars['ID']['input'];
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDrawingArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDrawingsArgs = {
  projectId: Scalars['ID']['input'];
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryLibraryItemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryLibraryItemsArgs = {
  category: InputMaybe<Scalars['String']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};


export type QueryMachineConfigArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMachineConfigsArgs = {
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMaterialArgs = {
  id: Scalars['ID']['input'];
};


export type QueryMaterialsArgs = {
  organizationId: InputMaybe<Scalars['ID']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMessagesArgs = {
  conversationId: Scalars['ID']['input'];
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryNotificationsArgs = {
  isRead: InputMaybe<Scalars['Boolean']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryOrganizationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryOrganizationsArgs = {
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryProjectArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProjectsArgs = {
  organizationId: InputMaybe<Scalars['ID']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPublicComponentsArgs = {
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPublicLibraryItemsArgs = {
  category: InputMaybe<Scalars['String']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};


export type QueryPublicMachineConfigsArgs = {
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPublicMaterialsArgs = {
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryPublicToolsArgs = {
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryToolArgs = {
  id: Scalars['ID']['input'];
};


export type QueryToolpathArgs = {
  id: Scalars['ID']['input'];
};


export type QueryToolpathsArgs = {
  projectId: Scalars['ID']['input'];
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryToolsArgs = {
  organizationId: InputMaybe<Scalars['ID']['input']>;
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  skip: InputMaybe<Scalars['Int']['input']>;
  take: InputMaybe<Scalars['Int']['input']>;
};

export type SendMessageInput = {
  content: Scalars['String']['input'];
  conversationId: Scalars['ID']['input'];
  fileId: InputMaybe<Scalars['ID']['input']>;
};

export type Subscription = {
  __typename?: 'Subscription';
  cancelAtPeriodEnd: Scalars['Boolean']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  lsCurrentPeriodEnd: Maybe<Scalars['DateTime']['output']>;
  lsCustomerId: Maybe<Scalars['String']['output']>;
  lsSubscriptionId: Maybe<Scalars['String']['output']>;
  lsVariantId: Maybe<Scalars['String']['output']>;
  messageAdded: Message;
  notificationAdded: Notification;
  plan: Scalars['String']['output'];
  status: Scalars['String']['output'];
  stripeCurrentPeriodEnd: Maybe<Scalars['DateTime']['output']>;
  stripeCustomerId: Maybe<Scalars['String']['output']>;
  stripePriceId: Maybe<Scalars['String']['output']>;
  stripeSubscriptionId: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};


export type SubscriptionMessageAddedArgs = {
  conversationId: Scalars['ID']['input'];
};

export type Token = {
  __typename?: 'Token';
  createdAt: Scalars['DateTime']['output'];
  expiresAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  metadata: Maybe<Scalars['Json']['output']>;
  token: Scalars['String']['output'];
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type Tool = {
  __typename?: 'Tool';
  coolantType: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  cuttingLength: Maybe<Scalars['Float']['output']>;
  diameter: Scalars['Float']['output'];
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  material: Scalars['String']['output'];
  maxRPM: Maybe<Scalars['Int']['output']>;
  name: Scalars['String']['output'];
  notes: Maybe<Scalars['String']['output']>;
  numberOfFlutes: Maybe<Scalars['Int']['output']>;
  organization: Maybe<Organization>;
  organizationId: Maybe<Scalars['ID']['output']>;
  owner: Maybe<User>;
  ownerId: Maybe<Scalars['ID']['output']>;
  shankDiameter: Maybe<Scalars['Float']['output']>;
  toolpaths: Array<Toolpath>;
  totalLength: Maybe<Scalars['Float']['output']>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type Toolpath = {
  __typename?: 'Toolpath';
  comments: Array<ToolpathComment>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: Scalars['ID']['output'];
  data: Maybe<Scalars['Json']['output']>;
  description: Maybe<Scalars['String']['output']>;
  drawing: Maybe<Drawing>;
  drawingId: Maybe<Scalars['ID']['output']>;
  gcode: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isPublic: Scalars['Boolean']['output'];
  machineConfig: Maybe<MachineConfig>;
  machineConfigId: Maybe<Scalars['ID']['output']>;
  material: Maybe<Material>;
  materialId: Maybe<Scalars['ID']['output']>;
  name: Scalars['String']['output'];
  operationType: Maybe<Scalars['String']['output']>;
  project: Project;
  projectId: Scalars['ID']['output'];
  thumbnail: Maybe<Scalars['String']['output']>;
  tool: Maybe<Tool>;
  toolId: Maybe<Scalars['ID']['output']>;
  type: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  versions: Array<ToolpathVersion>;
};

export type ToolpathComment = {
  __typename?: 'ToolpathComment';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['ID']['output'];
  toolpath: Toolpath;
  toolpathId: Scalars['ID']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type ToolpathVersion = {
  __typename?: 'ToolpathVersion';
  changeMessage: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  data: Maybe<Scalars['Json']['output']>;
  gcode: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  toolpath: Toolpath;
  toolpathId: Scalars['ID']['output'];
  user: User;
  userId: Scalars['ID']['output'];
};

export type UpdateComponentInput = {
  data: InputMaybe<Scalars['Json']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  thumbnail: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type UpdateDrawingInput = {
  data: InputMaybe<Scalars['Json']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  thumbnail: InputMaybe<Scalars['String']['input']>;
};

export type UpdateLibraryItemInput = {
  category: InputMaybe<Scalars['String']['input']>;
  data: InputMaybe<Scalars['Json']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  organizationId: InputMaybe<Scalars['ID']['input']>;
  properties: InputMaybe<Scalars['Json']['input']>;
  tags: InputMaybe<Array<Scalars['String']['input']>>;
  thumbnail: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMachineConfigInput = {
  config: InputMaybe<Scalars['Json']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type UpdateMaterialInput = {
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  organizationId: InputMaybe<Scalars['ID']['input']>;
  properties: InputMaybe<Scalars['Json']['input']>;
};

export type UpdateOrganizationInput = {
  description: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
};

export type UpdateProjectInput = {
  description: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  organizationId: InputMaybe<Scalars['ID']['input']>;
};

export type UpdateToolInput = {
  coolantType: InputMaybe<Scalars['String']['input']>;
  cuttingLength: InputMaybe<Scalars['Float']['input']>;
  diameter: InputMaybe<Scalars['Float']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  material: InputMaybe<Scalars['String']['input']>;
  maxRPM: InputMaybe<Scalars['Int']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  notes: InputMaybe<Scalars['String']['input']>;
  numberOfFlutes: InputMaybe<Scalars['Int']['input']>;
  organizationId: InputMaybe<Scalars['ID']['input']>;
  shankDiameter: InputMaybe<Scalars['Float']['input']>;
  totalLength: InputMaybe<Scalars['Float']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type UpdateToolpathInput = {
  data: InputMaybe<Scalars['Json']['input']>;
  description: InputMaybe<Scalars['String']['input']>;
  drawingId: InputMaybe<Scalars['ID']['input']>;
  gcode: InputMaybe<Scalars['String']['input']>;
  isPublic: InputMaybe<Scalars['Boolean']['input']>;
  machineConfigId: InputMaybe<Scalars['ID']['input']>;
  materialId: InputMaybe<Scalars['ID']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
  operationType: InputMaybe<Scalars['String']['input']>;
  thumbnail: InputMaybe<Scalars['String']['input']>;
  toolId: InputMaybe<Scalars['ID']['input']>;
  type: InputMaybe<Scalars['String']['input']>;
};

export type UpdateUserInput = {
  email: InputMaybe<Scalars['String']['input']>;
  image: InputMaybe<Scalars['String']['input']>;
  name: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  conversations: Array<ConversationParticipant>;
  createdAt: Scalars['DateTime']['output'];
  email: Maybe<Scalars['String']['output']>;
  emailVerified: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['ID']['output'];
  image: Maybe<Scalars['String']['output']>;
  libraryItems: Array<LibraryItem>;
  machineConfigs: Array<MachineConfig>;
  materials: Array<Material>;
  name: Maybe<Scalars['String']['output']>;
  notifications: Array<Notification>;
  organizations: Array<UserOrganization>;
  projects: Array<Project>;
  pushSubscriptions: Array<PushSubscription>;
  subscription: Maybe<Subscription>;
  tools: Array<Tool>;
  updatedAt: Scalars['DateTime']['output'];
};

export type UserOrganization = {
  __typename?: 'UserOrganization';
  id: Scalars['ID']['output'];
  joinedAt: Scalars['DateTime']['output'];
  organization: Organization;
  organizationId: Scalars['ID']['output'];
  role: UserRole;
  user: User;
  userId: Scalars['ID']['output'];
};

export enum UserRole {
  Admin = 'ADMIN',
  Manager = 'MANAGER',
  Member = 'MEMBER'
}
