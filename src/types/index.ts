// ============================================
// ENUMS - Based on BE ADNTester.BO.Enums
// ============================================

export enum UserRole {
  Admin = 0,
  Staff = 1,
  Client = 2,
  Manager = 3
}

export enum BookingStatus {
  Pending = 0,           // Chờ xử lý
  DepositPaid = 1,       // Đã đặt cọc
  KitDelivering = 2,     // Đang giao kit
  KitDelivered = 3,      // Đã giao kit
  SampleCollected = 4,   // Đã thu mẫu
  SampleDelivering = 5,  // Đang giao mẫu về lab
  SampleReceived = 6,    // Lab đã nhận mẫu
  Testing = 7,           // Đang xét nghiệm
  ResultReady = 8,       // Có kết quả
  FullyPaid = 9,         // Đã thanh toán đủ
  Completed = 10,        // Hoàn thành
  Cancelled = 11         // Đã hủy
}

export enum TestServiceType {
  Civil = 0,   // Dân sự
  Legal = 1    // Hành chính/Pháp lý
}

export enum SampleCollectionMethod {
  SelfSample = 0,   // Tự lấy mẫu
  AtFacility = 1    // Lấy mẫu tại cơ sở
}

export enum SampleType {
  Unknown = 0,
  BuccalSwab = 1,    // Tăm bông miệng
  Blood = 2,         // Máu
  HairWithRoot = 3,  // Tóc có chân
  Fingernail = 4,    // Móng tay
  Saliva = 5,        // Nước bọt
  Other = 99
}

export enum PaymentStatus {
  Pending = 0,    // Chưa thanh toán
  Deposited = 1,  // Đã đặt cọc
  Paid = 2,       // Đã thanh toán
  Failed = 3,     // Thất bại
  Refunded = 4,   // Đã hoàn tiền
  Cancelled = 5   // Đã hủy
}

export enum RelationshipToSubject {
  Unknown = 0,
  Father = 1,
  Mother = 2,
  Child = 3,
  Grandfather = 4,
  Grandmother = 5,
  Grandchild = 6,
  Brother = 7,
  Sister = 8,
  Uncle = 9,
  Aunt = 10,
  Nephew = 11,
  Niece = 12,
  Other = 99
}

export enum LogisticStatus {
  PreparingKit = 0,      // Đang chuẩn bị bộ kit
  DeliveringKit = 1,     // Đang giao bộ kit đến client
  KitDelivered = 2,      // Client đã nhận bộ kit
  WaitingForPickup = 3,  // Đợi staff đến lấy mẫu
  PickingUpSample = 4,   // Staff đang lấy mẫu
  SampleReceived = 5,    // Đã nhận được mẫu tại cơ sở
  Cancelled = 6          // Hủy giao hoặc lấy mẫu
}

export enum LogisticsType {
  Delivery = 0,  // Giao kit
  Pickup = 1     // Lấy mẫu
}

export enum OtpDeliveryMethod {
  Email = 0,
  Sms = 1
}

export enum OtpPurpose {
  ResetPassword = 0,
  VerifyAccount = 1,
  TwoFactorAuth = 2
}

export enum BlogStatus {
  Draft = 0,
  Published = 1
}

// ============================================
// INTERFACES - Based on BE ADNTester.BO.Entities
// ============================================

// Base Entity
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

// User
export interface User extends BaseEntity {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  passwordHash?: string;  // Not exposed to client
  role: UserRole;
  isActive: boolean;
}

// Test Service
export interface TestService extends BaseEntity {
  name: string;
  description: string;
  sampleCount: number;
  type: TestServiceType;
  isActive: boolean;
  imageUrl?: string;
  features?: string[];
  prices?: ServicePrice[];
}

// Service Price
export interface ServicePrice extends BaseEntity {
  serviceId: string;
  price: number;
  collectionMethod: SampleCollectionMethod;
  effectiveFrom: Date;
  effectiveTo?: Date;
  testServiceInfo?: TestService;
}

// Test Booking
export interface TestBooking extends BaseEntity {
  clientId: string;
  client?: User;
  testServiceId: string;
  testService?: TestService;
  price: number;
  collectionMethod: SampleCollectionMethod;
  status: BookingStatus;
  appointmentDate: Date;
  note?: string;
  clientName?: string;
  address?: string;
  phone?: string;
  kit?: TestKit;
  testResult?: TestResult;
}

// Test Kit
export interface TestKit extends BaseEntity {
  bookingId: string;
  booking?: TestBooking;
  collectionMethod: SampleCollectionMethod;
  deliveryInfoId?: string;
  deliveryInfo?: LogisticsInfo;
  pickupInfoId?: string;
  pickupInfo?: LogisticsInfo;
  sentToLabAt?: Date;
  labReceivedAt?: Date;
  sampleCount: number;
  note?: string;
  samples?: TestSample[];
}

// Test Sample
export interface TestSample extends BaseEntity {
  kitId: string;
  kit?: TestKit;
  sampleCode: string;
  donorName: string;
  relationshipToSubject: RelationshipToSubject;
  sampleType: SampleType;
  collectedById?: string;
  collector?: User;
  collectedAt?: Date;
  labReceivedAt?: Date;
}

// Test Result
export interface TestResult extends BaseEntity {
  testBookingId: string;
  testBooking?: TestBooking;
  resultSummary: string;
  resultDate: Date;
  resultFileUrl: string;
}

// Payment
export interface Payment extends BaseEntity {
  orderCode: number;
  amount: number;
  depositAmount?: number;
  remainingAmount?: number;
  status: PaymentStatus;
  paidAt?: Date;
  description?: string;
  bookingId: string;
  booking?: TestBooking;
}

// Logistics Info
export interface LogisticsInfo extends BaseEntity {
  staffId?: string;
  staff?: User;
  name: string;
  address: string;
  phone: string;
  scheduledAt?: Date;
  completedAt?: Date;
  note?: string;
  evidenceImageUrl?: string;
  type: LogisticsType;
  status: LogisticStatus;
}

// OTP Code
export interface OtpCode extends BaseEntity {
  userId: string;
  hashedCode: string;
  deliveryMethod: OtpDeliveryMethod;
  purpose: OtpPurpose;
  expiresAt: Date;
  isUsed: boolean;
  sentTo?: string;
}

// Blog & Tags
export interface Blog extends BaseEntity {
  title: string;
  content: string;
  summary?: string;
  imageUrl?: string;
  authorId: string;
  author?: User;
  isPublished: boolean;
  publishedAt?: Date;
  tags?: Tag[];
}

export interface Tag extends BaseEntity {
  name: string;
  slug: string;
}

// Feedback
export interface Feedback extends BaseEntity {
  userId: string;
  user?: User;
  bookingId?: string;
  booking?: TestBooking;
  rating: number;
  comment: string;
  isPublished: boolean;
}

// Sample Type Instruction
export interface SampleTypeInstruction extends BaseEntity {
  sampleType: SampleType;
  title: string;
  instructions: string;
  videoUrl?: string;
  imageUrls?: string[];
}

// ============================================
// STUDY GROUP TYPES
// ============================================

export type GroupMemberRole = 'admin' | 'moderator' | 'member';
export type GroupMemberStatus = 'active' | 'pending';
export type GroupMembershipStatus = 'none' | 'member' | 'pending';

// Study Group
export interface StudyGroup extends BaseEntity {
  name: string;
  description: string;
  coverColor: string;
  subjectTags: string[];
  isPrivate: boolean;
  createdBy: string;
  membersCount: number;
}

// Group Member
export interface GroupMember extends BaseEntity {
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: Date;
}

// Study Group with membership info (for API response)
export interface StudyGroupWithMembership extends StudyGroup {
  userMembershipStatus: GroupMembershipStatus;
  userMemberRole?: GroupMemberRole;
}

// Study Group Detail (with members list)
export interface StudyGroupDetail extends StudyGroupWithMembership {
  members: GroupMemberInfo[];
}

export interface GroupMemberInfo {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: Date;
}

// ============================================
// DTOs - Data Transfer Objects
// ============================================

// Auth DTOs
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userName: string;
  role: string;
  userId: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  role?: UserRole;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ConfirmResetPasswordRequest {
  email: string;
  otpCode: string;
  newPassword: string;
}

export interface CreateStaffRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  address: string;
  role: UserRole.Staff | UserRole.Manager;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  address?: string;
}

export interface UserProfileResponse {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

// Service DTOs
export interface CreateTestServiceDto {
  name: string;
  description: string;
  sampleCount: number;
  type: TestServiceType;
  imageUrl?: string;
  features?: string[];
  prices: CreateServicePriceDto[];
}

export interface CreateServicePriceDto {
  price: number;
  collectionMethod: SampleCollectionMethod;
}

export interface UpdateTestServiceDto {
  id: string;
  name?: string;
  description?: string;
  sampleCount?: number;
  type?: TestServiceType;
  isActive?: boolean;
  imageUrl?: string;
  features?: string[];
}

// Service Price DTOs
export interface CreateServicePriceFullDto {
  serviceId: string;
  price: number;
  collectionMethod: SampleCollectionMethod;
  effectiveFrom?: Date;
  effectiveTo?: Date;
}

export interface UpdateServicePriceDto {
  id: string;
  price?: number;
  collectionMethod?: SampleCollectionMethod;
  effectiveTo?: Date;
}

// Booking DTOs
export interface CreateTestBookingDto {
  testServiceId: string;
  priceServiceId: string;
  collectionMethod: SampleCollectionMethod;
  appointmentDate: Date;
  note?: string;
  clientName: string;
  address?: string;
  phone: string;
}

export interface UpdateTestBookingDto {
  id: string;
  appointmentDate?: Date;
  note?: string;
  status?: BookingStatus;
}

// Sample DTOs
export interface CreateTestSampleDto {
  kitId: string;
  donorName: string;
  relationshipToSubject: RelationshipToSubject;
  sampleType: SampleType;
}

export interface UpdateTestSampleDto {
  id: string;
  sampleType?: SampleType;
  collectedAt?: Date;
}

// Result DTOs
export interface CreateTestResultDto {
  testBookingId: string;
  resultSummary: string;
  resultFileUrl: string;
}

// API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode?: number;
}

// Pagination
export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// UTILITY TYPES
// ============================================

// Status Labels (Vietnamese)
export const BookingStatusLabels: Record<BookingStatus, string> = {
  [BookingStatus.Pending]: 'Chờ xử lý',
  [BookingStatus.DepositPaid]: 'Đã đặt cọc',
  [BookingStatus.KitDelivering]: 'Đang giao kit',
  [BookingStatus.KitDelivered]: 'Đã giao kit',
  [BookingStatus.SampleCollected]: 'Đã thu mẫu',
  [BookingStatus.SampleDelivering]: 'Đang giao mẫu',
  [BookingStatus.SampleReceived]: 'Đã nhận mẫu',
  [BookingStatus.Testing]: 'Đang xét nghiệm',
  [BookingStatus.ResultReady]: 'Có kết quả',
  [BookingStatus.FullyPaid]: 'Đã thanh toán đủ',
  [BookingStatus.Completed]: 'Hoàn thành',
  [BookingStatus.Cancelled]: 'Đã hủy'
};

export const UserRoleLabels: Record<UserRole, string> = {
  [UserRole.Admin]: 'Quản trị viên',
  [UserRole.Staff]: 'Nhân viên',
  [UserRole.Client]: 'Khách hàng',
  [UserRole.Manager]: 'Quản lý'
};

export const SampleTypeLabels: Record<SampleType, string> = {
  [SampleType.Unknown]: 'Chưa xác định',
  [SampleType.BuccalSwab]: 'Tăm bông miệng',
  [SampleType.Blood]: 'Máu',
  [SampleType.HairWithRoot]: 'Tóc có chân',
  [SampleType.Fingernail]: 'Móng tay',
  [SampleType.Saliva]: 'Nước bọt',
  [SampleType.Other]: 'Khác'
};

export const TestServiceTypeLabels: Record<TestServiceType, string> = {
  [TestServiceType.Civil]: 'Dân sự',
  [TestServiceType.Legal]: 'Hành chính'
};

export const CollectionMethodLabels: Record<SampleCollectionMethod, string> = {
  [SampleCollectionMethod.SelfSample]: 'Tự lấy mẫu',
  [SampleCollectionMethod.AtFacility]: 'Lấy mẫu tại cơ sở'
};

export const PaymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'Chờ thanh toán',
  [PaymentStatus.Deposited]: 'Đã đặt cọc',
  [PaymentStatus.Paid]: 'Đã thanh toán',
  [PaymentStatus.Failed]: 'Thất bại',
  [PaymentStatus.Refunded]: 'Đã hoàn tiền',
  [PaymentStatus.Cancelled]: 'Đã hủy'
};

// Format helpers
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

