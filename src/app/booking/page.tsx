'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer, Loading } from '@/components/shared';
import {
  Calendar,
  Clock,
  User,
  Phone,
  MapPin,
  CheckCircle,
  Home,
  Building,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  category: 'civil' | 'legal';
  collectionMethod: number;
  priceOptions: Array<{
    id: string;
    price: number;
    collectionMethod: number;
  }>;
}

interface ApiServicePrice {
  id: string;
  price: number;
  collectionMethod: number;
}

interface ApiService {
  id: string;
  name: string;
  description: string;
  type: number;
  isActive: boolean;
  prices?: ApiServicePrice[];
}

interface BookingFormData {
  serviceType: 'home' | 'clinic';
  name: string;
  phone: string;
  address: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
}

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00',
];

// Main booking content component
function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const serviceId = searchParams.get('serviceId');

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<BookingFormData>({
    serviceType: 'home',
    name: '',
    phone: '',
    address: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });

  useEffect(() => {
    const loadService = async () => {
      setLoading(true);
      try {
        if (!serviceId) {
          setService(null);
          return;
        }

        const response = await fetch(`/api/services/${serviceId}`);
        if (!response.ok) {
          throw new Error('Không thể tải thông tin dịch vụ');
        }

        const data = await response.json();
        const serviceData = data?.data as ApiService | undefined;

        if (!serviceData?.isActive) {
          setService(null);
          return;
        }

        const priceOptions = (serviceData.prices ?? []).filter((price) => {
          return typeof price?.price === 'number' && typeof price?.collectionMethod === 'number';
        });

        const hasSelfSample = priceOptions.some((price) => price.collectionMethod === 0);
        const hasFacility = priceOptions.some((price) => price.collectionMethod === 1);
        const collectionMethod = hasSelfSample && hasFacility ? 2 : hasSelfSample ? 0 : 1;

        const foundService: Service = {
          id: serviceData.id,
          title: serviceData.name,
          description: serviceData.description,
          category: serviceData.type === 1 ? 'legal' : 'civil',
          collectionMethod,
          priceOptions,
        };

        setService(foundService);

        const defaultServiceType = hasSelfSample ? 'home' : 'clinic';
        setFormData((prev) => ({
          ...prev,
          serviceType: defaultServiceType,
          address: defaultServiceType === 'clinic' ? 'TẠI CƠ SỞ' : '',
        }));
      } catch (error) {
        console.error('Error loading service:', error);
      } finally {
        setLoading(false);
      }
    };

    loadService();
  }, [serviceId]);

  const handleInputChange = (field: keyof BookingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateStep1 = () => {
    return service && formData.serviceType;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }

    if (!formData.phone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (formData.serviceType === 'home' && !formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ';
    }

    if (!formData.preferredDate) {
      newErrors.preferredDate = 'Vui lòng chọn ngày hẹn';
    }

    if (!formData.preferredTime) {
      newErrors.preferredTime = 'Vui lòng chọn thời gian';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setSubmitting(true);
    try {
      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        // Show confirmation to login
        if (confirm('Bạn cần đăng nhập để đặt lịch. Bạn có muốn đăng nhập ngay không?')) {
          // Save booking info to sessionStorage to restore after login
          sessionStorage.setItem('pendingBooking', JSON.stringify({
            serviceId: service?.id,
            formData,
          }));
          router.push('/login');
        }
        return;
      }

      // Call API to create booking
      const selectedPrice = getSelectedPriceOption(service, formData.serviceType);
      if (!selectedPrice) {
        throw new Error('Không tìm thấy giá dịch vụ phù hợp');
      }

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          testServiceId: service?.id,
          priceServiceId: selectedPrice.id,
          appointmentDate: `${formData.preferredDate}T${formData.preferredTime}:00`,
          address: formData.address,
          phone: formData.phone,
          clientName: formData.name,
          note: formData.notes,
          collectionMethod: formData.serviceType === 'home' ? 0 : 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle token expired - redirect to login
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (confirm('Phiên đăng nhập đã hết hạn. Bạn có muốn đăng nhập lại không?')) {
            sessionStorage.setItem('pendingBooking', JSON.stringify({
              serviceId: service?.id,
              formData,
            }));
            router.push('/login');
          }
          return;
        }
        throw new Error(data.message || 'Đặt lịch thất bại');
      }

      setStep(3);
    } catch (error) {
      console.error('Booking error:', error);
      alert(error instanceof Error ? error.message : 'Có lỗi xảy ra khi đặt lịch');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getSelectedPriceOption = (
    currentService: Service | null,
    serviceType: BookingFormData['serviceType']
  ) => {
    if (!currentService?.priceOptions.length) {
      return null;
    }

    const targetMethod = serviceType === 'home' ? 0 : 1;
    return (
      currentService.priceOptions.find((price) => price.collectionMethod === targetMethod) ||
      currentService.priceOptions[0]
    );
  };

  const availableMethods = new Set(
    service?.priceOptions.map((price) => price.collectionMethod) ?? []
  );

  const selectedPrice = getSelectedPriceOption(service, formData.serviceType);

  const getAvailableTimeSlots = () => {
    if (!formData.preferredDate) return timeSlots;
    
    const selectedDate = new Date(formData.preferredDate);
    const today = new Date();
    
    if (selectedDate.toDateString() !== today.toDateString()) {
      return timeSlots;
    }
    
    const currentMinutes = today.getHours() * 60 + today.getMinutes();
    return timeSlots.filter(time => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes > currentMinutes;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loading size="large" message="Đang tải thông tin dịch vụ..." />
        </div>
        <Footer />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
          <h2 className="mb-4 text-2xl font-bold text-gray-800">Không tìm thấy dịch vụ</h2>
          <p className="mb-6 text-gray-600">Dịch vụ bạn tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <Link
            href="/services"
            className="flex items-center gap-2 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách dịch vụ
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      <main className="container max-w-4xl px-4 py-12 mx-auto">
        {/* Breadcrumb */}
        <nav className="flex mb-8 text-sm">
          <Link href="/" className="text-blue-600 hover:text-blue-800">Trang Chủ</Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link href="/services" className="text-blue-600 hover:text-blue-800">Dịch Vụ</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="font-semibold text-blue-900">Đặt Lịch</span>
        </nav>

        {/* Card */}
        <div className="overflow-hidden bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="p-6 text-white bg-gradient-to-r from-blue-900 to-blue-700">
            <h1 className="mb-2 text-2xl font-bold">Đặt Lịch Xét Nghiệm ADN</h1>
            <p className="text-blue-100">Chọn gói xét nghiệm và phương thức thu mẫu phù hợp</p>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mt-6 space-x-4">
              {[1, 2, 3].map((stepNum) => (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors ${
                      step >= stepNum ? 'bg-white text-blue-900' : 'bg-white/20 text-white'
                    }`}
                  >
                    {step > stepNum ? <CheckCircle className="w-5 h-5" /> : stepNum}
                  </div>
                  {stepNum < 3 && (
                    <div className={`w-12 h-0.5 ${step > stepNum ? 'bg-white' : 'bg-white/20'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Step 1: Service Selection */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Selected Service */}
                <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
                  <h3 className="mb-2 text-lg font-bold text-blue-900">{service.title}</h3>
                  <p className="mb-3 text-sm text-gray-600">{service.description}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      service.category === 'civil' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {service.category === 'civil' ? 'Dân sự' : 'Hành chính'}
                    </span>
                    <span className="text-xl font-bold text-blue-900">
                      {selectedPrice ? formatPrice(selectedPrice.price) : 'Liên hệ'}
                    </span>
                  </div>
                </div>

                {/* Collection Method */}
                <div>
                  <h3 className="mb-4 text-lg font-semibold text-blue-900">Hình thức thu mẫu</h3>
                  <div className={`grid gap-4 ${availableMethods.size <= 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {(availableMethods.has(0) || availableMethods.size === 0) && (
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="serviceType"
                          value="home"
                          checked={formData.serviceType === 'home'}
                          onChange={(e) => handleInputChange('serviceType', e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-6 border-2 rounded-lg text-center transition-all ${
                          formData.serviceType === 'home' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}>
                          <Home className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                          <h4 className="mb-2 font-semibold text-gray-800">Tự thu mẫu / Thu tại nhà</h4>
                          <p className="text-sm text-gray-600">Nhận bộ kit ADN hoặc nhân viên đến tận nhà</p>
                        </div>
                      </label>
                    )}

                    {(availableMethods.has(1) || availableMethods.size === 0) && (
                      <label className="cursor-pointer">
                        <input
                          type="radio"
                          name="serviceType"
                          value="clinic"
                          checked={formData.serviceType === 'clinic'}
                          onChange={(e) => {
                            handleInputChange('serviceType', e.target.value);
                            handleInputChange('address', 'TẠI CƠ SỞ');
                          }}
                          className="sr-only"
                        />
                        <div className={`p-6 border-2 rounded-lg text-center transition-all ${
                          formData.serviceType === 'clinic' 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}>
                          <Building className="w-12 h-12 mx-auto mb-3 text-blue-600" />
                          <h4 className="mb-2 font-semibold text-gray-800">Thu mẫu tại trung tâm</h4>
                          <p className="text-sm text-gray-600">Đến trung tâm với quy trình chuẩn</p>
                          <span className="inline-block px-2 py-1 mt-2 text-xs font-medium text-green-700 bg-green-100 rounded-full">
                            ⚖️ Có giá trị pháp lý
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!validateStep1()}
                    className="px-8 py-3 font-semibold text-white transition-colors bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tiếp Theo
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Information Form */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-blue-900">Thông tin liên hệ và đặt lịch</h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-blue-900">
                      <User className="w-4 h-4 mr-2" />
                      Họ và Tên *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nhập họ và tên"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-blue-900">
                      <Phone className="w-4 h-4 mr-2" />
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleInputChange('phone', value);
                      }}
                      placeholder="Nhập số điện thoại"
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                  </div>

                  {/* Address */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center text-sm font-semibold text-blue-900">
                      <MapPin className="w-4 h-4 mr-2" />
                      {formData.serviceType === 'home' ? 'Địa chỉ nhận kit / Thu mẫu *' : 'Địa chỉ thực hiện'}
                    </label>
                    {formData.serviceType === 'home' ? (
                      <>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          placeholder="Nhập địa chỉ nhận bộ kit ADN"
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                            errors.address ? 'border-red-500' : 'border-gray-200'
                          }`}
                        />
                        {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                      </>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value="TẠI CƠ SỞ"
                          disabled
                          className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-lg"
                        />
                        <p className="mt-1 text-xs text-blue-600">
                          <strong>Lưu ý:</strong> Bạn sẽ đến trung tâm để thực hiện xét nghiệm
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-blue-900">
                      <Calendar className="w-4 h-4 mr-2" />
                      Ngày hẹn *
                    </label>
                    <input
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                        errors.preferredDate ? 'border-red-500' : 'border-gray-200'
                      }`}
                    />
                    {errors.preferredDate && <p className="text-sm text-red-500">{errors.preferredDate}</p>}
                  </div>

                  {/* Time */}
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-blue-900">
                      <Clock className="w-4 h-4 mr-2" />
                      Thời gian *
                    </label>
                    <select
                      value={formData.preferredTime}
                      onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:border-blue-500 ${
                        errors.preferredTime ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      <option value="">Chọn thời gian</option>
                      {getAvailableTimeSlots().map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                    {errors.preferredTime && <p className="text-sm text-red-500">{errors.preferredTime}</p>}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="flex items-center text-sm font-semibold text-blue-900">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Lưu ý thêm
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Ví dụ: Cần xét nghiệm cha con, mẹ con..."
                      className="w-full h-24 px-4 py-3 border-2 border-gray-200 rounded-lg resize-none focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => setStep(1)}
                    className="px-6 py-3 font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Quay Lại
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                        Đang xử lý...
                      </span>
                    ) : (
                      'Xác Nhận Đặt Lịch'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="py-8 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="mb-2 text-2xl font-bold text-green-600">Đặt lịch thành công!</h3>
                <p className="mb-6 text-gray-600">
                  Chúng tôi đã nhận được yêu cầu xét nghiệm của bạn. Nhân viên tư vấn sẽ liên hệ trong vòng 30 phút.
                </p>

                <div className="p-4 mb-6 text-left rounded-lg bg-blue-50">
                  <p className="text-sm text-blue-800">
                    <strong>Dịch vụ:</strong> {service.title}
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    <strong>Thời gian:</strong> {formData.preferredDate} lúc {formData.preferredTime}
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    <strong>Khách hàng:</strong> {formData.name}
                  </p>
                  <p className="mt-1 text-sm text-blue-800">
                    <strong>Số điện thoại:</strong> {formData.phone}
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <Link
                    href="/customer/bookings"
                    className="px-6 py-3 font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800"
                  >
                    Xem danh sách đặt lịch
                  </Link>
                  <Link
                    href="/"
                    className="px-6 py-3 font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Về trang chủ
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Loading fallback component
function BookingLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex items-center justify-center py-32">
        <Loading size="large" message="Đang tải trang đặt lịch..." />
      </div>
      <Footer />
    </div>
  );
}

// Main export with Suspense wrapper
export default function BookingPage() {
  return (
    <Suspense fallback={<BookingLoading />}>
      <BookingContent />
    </Suspense>
  );
}
