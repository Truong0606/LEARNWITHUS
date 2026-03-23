// ============================================
// ENUMS - Based on BE ADNTester.BO.Enums
// ============================================

export enum UserRole {
  Admin = 0,
  Staff = 1,
  Client = 2,
  Manager = 3,
  Mentor = 4
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
  avatarUrl?: string;
  passwordHash?: string;  // Not exposed to client
  role: UserRole;
  isActive: boolean;
  // VIP status
  vipPlan?: VipPlanId;
  vipExpiresAt?: Date;
  // VIP free mentor sessions (tracks current month usage, key = "YYYY-MM")
  vipFreeSessionsMonthKey?: string;
  vipFreeSessionsUsed?: number;
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

// VIP Plan
export type VipPlanId = 'monthly' | 'quarterly' | 'yearly';

export interface VipPlan {
  id: VipPlanId;
  name: string;
  price: number;
  durationDays: number;
  freeSessionsPerMonth: number; // Number of free mentor sessions per month
  discountPercent: number;       // % discount on paid sessions
}

export const VIP_PLANS: Record<VipPlanId, VipPlan> = {
  monthly:   { id: 'monthly',   name: 'Hàng tháng', price: 132000,   durationDays: 30,  freeSessionsPerMonth: 2, discountPercent: 10 },
  quarterly: { id: 'quarterly', name: '3 tháng',    price: 330000, durationDays: 90,  freeSessionsPerMonth: 2, discountPercent: 15 },
  yearly:    { id: 'yearly',    name: '1 năm',      price: 1060000, durationDays: 365, freeSessionsPerMonth: 3, discountPercent: 20 },
};

// Revenue source types for admin revenue dashboard
export type RevenueSourceType = 'vip_upgrade' | 'mentor_upgrade' | 'mentor_session' | 'mentor_consultation' | 'test_booking';

// Mentor Earning (track per-booking payouts)
export interface MentorEarning {
  bookingId: string;
  mentorId: string;
  userId: string;
  userName?: string;
  topic: string;
  type: MentorBookingType;
  amount: number;           // Student paid
  mentorAmount: number;     // Mentor receives (80%)
  platformFee: number;      // Platform keeps (20%)
  isFreeVipSession: boolean;
  scheduledAt: string;
  completedAt?: string;
  mentorPaid: boolean;
  mentorPaidAt?: string;
}

// Payment
export type PaymentFor = 'test_booking' | 'mentor_booking' | 'vip_upgrade';

export interface Payment extends BaseEntity {
  orderCode: number;
  amount: number;
  depositAmount?: number;
  remainingAmount?: number;
  status: PaymentStatus;
  paidAt?: Date;
  description?: string;
  // test booking payment
  bookingId?: string;
  booking?: TestBooking;
  // mentor booking payment
  mentorBookingId?: string;
  mentorBooking?: MentorBooking;
  // vip upgrade payment
  userId?: string;
  planId?: VipPlanId;
  // payment target discriminator
  paymentFor?: PaymentFor;
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
  rules?: string[];
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
  pendingMembers?: GroupMemberInfo[];
}

export interface GroupMemberInfo {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
  role: GroupMemberRole;
  status: GroupMemberStatus;
  joinedAt: Date;
}

// ============================================
// COMMUNITY POST TYPES
// ============================================

export type PostVisibility = 'public' | 'group';

export interface PostAttachment {
  url: string;
  name: string;
  type: string; // 'pdf' | 'docx' | 'jpg' | 'png'
  size: number; // bytes
}

export interface CommunityPost extends BaseEntity {
  authorId: string;
  authorName: string;
  authorAvatar: string; // initials e.g. "HM"
  authorAvatarUrl?: string | null; // user's actual avatar image URL
  authorTag: string; // e.g. "SV - Khoa CNTT"
  authorIsVip?: boolean; // VIP badge on post
  groupId: string | null;
  groupName: string | null;
  title: string;
  body: string;
  tags: string[];
  images: string[];
  attachments?: PostAttachment[]; // document attachments (PDF, DOCX, JPG, PNG)
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  likedBy: string[]; // array of userIds
  savedBy: string[]; // array of userIds
  pinned: boolean;
  anonymous: boolean;
}

export interface CommunityComment extends BaseEntity {
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorAvatarUrl?: string | null;
  authorIsVip?: boolean; // VIP badge on comment
  body: string;
  parentId: string | null; // null = top-level, else reply
  likesCount: number;
  likedBy: string[];
}

// Mentor Request
export type MentorRequestStatus = 'pending' | 'approved' | 'denied';

export interface MentorRequest extends BaseEntity {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  experience?: string;
  availability?: string;
  pricePerSession?: number;
  bio?: string;
  goal: string;
  bankName?: string;
  bankAccountNumber?: string;
  status: MentorRequestStatus;
  approvedBy?: string;
  approvedAt?: Date;
}

// Mentor Profile (created when admin approves a mentor request)
export interface MentorProfile extends BaseEntity {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  subjects: string[];
  experience?: string;
  availability: string[];
  pricePerSession: number;
  bio?: string;
  avatarUrl?: string;
  company?: string;
  university?: string;
  title?: string;
  bankName?: string;
  bankAccountNumber?: string;
  rating: number;
  reviewCount: number;
  sessionCount: number;
  menteeCount: number;
  isActive: boolean;
}

// Mentor Review
export interface MentorReview extends BaseEntity {
  mentorId: string;
  userId: string;
  bookingId: string;
  rating: number;
  comment: string;
  userName?: string;
}

// Mentor Booking (học cùng / tư vấn)
export type MentorBookingType = 'session' | 'consultation';

export type MentorBookingStatus = 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';

export interface MentorBooking extends BaseEntity {
  userId: string;
  mentorId: string;
  type: MentorBookingType;
  amount: number;
  status: MentorBookingStatus;
  scheduledAt: Date;
  topic: string;
  note?: string;
  paymentId?: string;
  userName?: string;
  mentorName?: string;
  reviewId?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;
  canRefund?: boolean;
  mentorPaid?: boolean;
  mentorPaidAt?: Date;
  completedAt?: Date;
  // Online session link (set by mentor after confirmation)
  meetingLink?: string;
  // VIP free session flag
  isFreeVipSession?: boolean;
}

// Mentor Course (khóa học do mentor tạo)
export interface MentorCourse extends BaseEntity {
  mentorId: string;
  mentorName?: string;
  title: string;
  description: string;
  subject: string;
  price: number;
  duration: string;       // e.g. "8 buổi", "1 tháng"
  maxStudents?: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  isActive: boolean;
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
  avatarUrl?: string;
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
  isMentor?: boolean;
  vipPlan?: string | null;
  vipExpiresAt?: string | null;
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
  [UserRole.Manager]: 'Quản lý',
  [UserRole.Mentor]: 'Mentor'
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

