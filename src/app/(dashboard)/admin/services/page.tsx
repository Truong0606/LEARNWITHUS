'use client';

import { useEffect, useMemo, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import {
  CheckCircle,
  Edit3,
  Plus,
  RefreshCcw,
  Save,
  Trash2,
  XCircle,
} from 'lucide-react';

interface ApiServicePrice {
  id: string;
  serviceId: string;
  price: number;
  collectionMethod: number;
  testServiceInfor?: {
    id: string;
    name: string;
    description: string;
    sampleCount: number;
    type: number;
    isActive: boolean;
    imageUrl?: string;
    features?: string[];
  };
}

interface ServicePrice {
  id: string;
  price: number;
  collectionMethod: number;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  sampleCount: number;
  type: number;
  isActive: boolean;
  imageUrl?: string;
  features: string[];
  prices: ServicePrice[];
}

interface FormState {
  id?: string;
  name: string;
  description: string;
  sampleCount: number;
  type: number;
  isActive: boolean;
  imageUrl: string;
  featuresText: string;
  selfSamplePrice: string;
  facilityPrice: string;
  selfSamplePriceId?: string;
  facilityPriceId?: string;
}

const defaultFormState: FormState = {
  name: '',
  description: '',
  sampleCount: 2,
  type: 0,
  isActive: true,
  imageUrl: '',
  featuresText: '',
  selfSamplePrice: '',
  facilityPrice: '',
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const normalizeServices = (prices: ApiServicePrice[]): ServiceItem[] => {
  const servicesMap = new Map<string, ServiceItem>();

  for (const price of prices) {
    const service = price.testServiceInfor;
    if (!service) {
      continue;
    }

    if (!servicesMap.has(service.id)) {
      servicesMap.set(service.id, {
        id: service.id,
        name: service.name,
        description: service.description,
        sampleCount: service.sampleCount,
        type: service.type,
        isActive: service.isActive,
        imageUrl: service.imageUrl,
        features: service.features ?? [],
        prices: [],
      });
    }

    servicesMap.get(service.id)?.prices.push({
      id: price.id,
      price: price.price,
      collectionMethod: price.collectionMethod,
    });
  }

  return Array.from(servicesMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userRole =
    typeof window !== 'undefined'
      ? (JSON.parse(localStorage.getItem('user') ?? 'null')?.role as string | undefined)
      : undefined;

  const filteredServices = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return services;
    return services.filter((service) => {
      return (
        service.name.toLowerCase().includes(keyword) ||
        service.description.toLowerCase().includes(keyword)
      );
    });
  }, [services, searchTerm]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Không thể tải danh sách dịch vụ');
      }
      const result = await response.json();
      const data = Array.isArray(result?.data) ? (result.data as ApiServicePrice[]) : [];
      setServices(normalizeServices(data));
    } catch (err) {
      console.error('Error loading services:', err);
      setError('Không thể tải danh sách dịch vụ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const resetForm = () => {
    setFormState(defaultFormState);
    setMode('create');
  };

  const ensureOk = async (response: Response, fallback: string) => {
    if (response.ok) return;
    let message = fallback;
    try {
      const data = await response.json();
      message = data?.message || fallback;
    } catch {
      message = fallback;
    }
    throw new Error(message);
  };

  const fillForm = (service: ServiceItem) => {
    const selfSample = service.prices.find((price) => price.collectionMethod === 0);
    const facility = service.prices.find((price) => price.collectionMethod === 1);

    setFormState({
      id: service.id,
      name: service.name,
      description: service.description,
      sampleCount: service.sampleCount,
      type: service.type,
      isActive: service.isActive,
      imageUrl: service.imageUrl ?? '',
      featuresText: service.features.join('\n'),
      selfSamplePrice: selfSample ? String(selfSample.price) : '',
      facilityPrice: facility ? String(facility.price) : '',
      selfSamplePriceId: selfSample?.id,
      facilityPriceId: facility?.id,
    });
    setMode('edit');
  };

  const handleSave = async () => {
    if (!token) {
      setError('Bạn cần đăng nhập bằng tài khoản Admin để thao tác.');
      return;
    }
    if (userRole && !['Admin', 'Manager'].includes(userRole)) {
      setError('Tài khoản hiện tại không có quyền Admin/Manager.');
      return;
    }

    setSaving(true);
    setError(null);

    const features = formState.featuresText
      .split('\n')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const selfSampleValue = formState.selfSamplePrice.trim();
    const facilityValue = formState.facilityPrice.trim();
    const hasSelfSample = formState.type !== 1 && selfSampleValue.length > 0;
    const hasFacility = facilityValue.length > 0;

    if (!formState.name.trim() || !formState.description.trim()) {
      setError('Vui lòng nhập tên và mô tả dịch vụ.');
      setSaving(false);
      return;
    }

    if (!hasSelfSample && !hasFacility) {
      setError('Vui lòng nhập ít nhất một mức giá.');
      setSaving(false);
      return;
    }

    if (formState.type === 1 && selfSampleValue) {
      setError('Dịch vụ hành chính không thể có giá tự lấy mẫu.');
      setSaving(false);
      return;
    }

    try {
      if (mode === 'create') {
        const prices = [
          hasSelfSample ? { price: Number(selfSampleValue), collectionMethod: 0 } : null,
          hasFacility ? { price: Number(facilityValue), collectionMethod: 1 } : null,
        ].filter(Boolean);

        const response = await fetch('/api/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: formState.name,
            description: formState.description,
            sampleCount: Number(formState.sampleCount),
            type: formState.type,
            imageUrl: formState.imageUrl,
            features,
            prices,
          }),
        });

        await ensureOk(response, 'Tạo dịch vụ thất bại');
      } else if (formState.id) {
        const response = await fetch(`/api/services/${formState.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: formState.id,
            name: formState.name,
            description: formState.description,
            sampleCount: Number(formState.sampleCount),
            type: formState.type,
            isActive: formState.isActive,
            imageUrl: formState.imageUrl,
            features,
          }),
        });

        await ensureOk(response, 'Cập nhật dịch vụ thất bại');

        if (hasSelfSample) {
          if (formState.selfSamplePriceId) {
            const priceResponse = await fetch(`/api/services/prices/${formState.selfSamplePriceId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                id: formState.selfSamplePriceId,
                price: Number(selfSampleValue),
                collectionMethod: 0,
              }),
            });
            await ensureOk(priceResponse, 'Cập nhật giá tự lấy mẫu thất bại');
          } else {
            const priceResponse = await fetch('/api/services/prices', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                serviceId: formState.id,
                price: Number(selfSampleValue),
                collectionMethod: 0,
              }),
            });
            await ensureOk(priceResponse, 'Tạo giá tự lấy mẫu thất bại');
          }
        }

        if (hasFacility) {
          if (formState.facilityPriceId) {
            const priceResponse = await fetch(`/api/services/prices/${formState.facilityPriceId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                id: formState.facilityPriceId,
                price: Number(facilityValue),
                collectionMethod: 1,
              }),
            });
            await ensureOk(priceResponse, 'Cập nhật giá tại cơ sở thất bại');
          } else {
            const priceResponse = await fetch('/api/services/prices', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                serviceId: formState.id,
                price: Number(facilityValue),
                collectionMethod: 1,
              }),
            });
            await ensureOk(priceResponse, 'Tạo giá tại cơ sở thất bại');
          }
        }
      }

      await fetchServices();
      resetForm();
    } catch (err) {
      console.error('Save service error:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu dịch vụ.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!token) {
      setError('Bạn cần đăng nhập bằng tài khoản Admin để thao tác.');
      return;
    }
    if (userRole && !['Admin', 'Manager'].includes(userRole)) {
      setError('Tài khoản hiện tại không có quyền Admin/Manager.');
      return;
    }

    if (!confirm('Bạn có chắc muốn xóa dịch vụ này?')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await ensureOk(response, 'Xóa dịch vụ thất bại');

      await fetchServices();
      resetForm();
    } catch (err) {
      console.error('Delete service error:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa dịch vụ.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrice = async (priceId: string) => {
    if (!token) {
      setError('Bạn cần đăng nhập bằng tài khoản Admin để thao tác.');
      return;
    }
    if (userRole && !['Admin', 'Manager'].includes(userRole)) {
      setError('Tài khoản hiện tại không có quyền Admin/Manager.');
      return;
    }

    if (!confirm('Bạn có chắc muốn xóa mức giá này?')) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/services/prices/${priceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await ensureOk(response, 'Xóa giá thất bại');

      await fetchServices();
      resetForm();
    } catch (err) {
      console.error('Delete price error:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi xóa giá.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-transparent">
        <Loading size="large" message="Đang tải dữ liệu dịch vụ..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="🧬 Quản lý dịch vụ ADN" />

      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Danh sách dịch vụ</h2>
            <p className="text-sm text-gray-500">Cập nhật thông tin dịch vụ và giá ngay tại đây.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm kiếm dịch vụ..."
              className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={fetchServices}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <RefreshCcw size={16} />
              Làm mới
            </button>
            <button
              onClick={resetForm}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
            >
              <Plus size={16} />
              Tạo mới
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            {filteredServices.length === 0 ? (
              <div className="p-6 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
                Chưa có dịch vụ nào.
              </div>
            ) : (
              filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="p-5 bg-white border border-gray-200 rounded-xl shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                      <p className="text-sm text-gray-500">{service.description}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                        <span className="px-2 py-1 text-blue-700 bg-blue-50 rounded-full">
                          {service.type === 1 ? 'Hành chính' : 'Dân sự'}
                        </span>
                        <span className="px-2 py-1 text-gray-700 bg-gray-100 rounded-full">
                          {service.sampleCount} mẫu
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full ${
                            service.isActive
                              ? 'text-green-700 bg-green-50'
                              : 'text-red-700 bg-red-50'
                          }`}
                        >
                          {service.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
                        {service.prices.map((price) => (
                          <span key={price.id}>
                            {price.collectionMethod === 0 ? 'Tự lấy mẫu' : 'Tại cơ sở'}:{' '}
                            <span className="font-semibold text-gray-800">
                              {formatCurrency(price.price)}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => fillForm(service)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
                      >
                        <Edit3 size={16} />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {mode === 'create' ? 'Tạo dịch vụ mới' : 'Cập nhật dịch vụ'}
              </h3>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold ${
                  mode === 'create' ? 'text-green-700' : 'text-blue-700'
                }`}
              >
                {mode === 'create' ? <Plus size={14} /> : <Edit3 size={14} />}
                {mode === 'create' ? 'Create' : 'Edit'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-sm font-semibold text-gray-700">Tên dịch vụ</label>
                <input
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-sm font-semibold text-gray-700">Mô tả</label>
                <textarea
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="w-full h-20 px-4 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Số mẫu</label>
                  <input
                    type="number"
                    min={1}
                    value={formState.sampleCount}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        sampleCount: Number(event.target.value),
                      }))
                    }
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Loại dịch vụ</label>
                  <select
                    value={formState.type}
                    onChange={(event) => {
                      const nextType = Number(event.target.value);
                      setFormState((prev) => ({
                        ...prev,
                        type: nextType,
                        selfSamplePrice: nextType === 1 ? '' : prev.selfSamplePrice,
                      }));
                    }}
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Dân sự</option>
                    <option value={1}>Hành chính</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Trạng thái</label>
                  <button
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({ ...prev, isActive: !prev.isActive }))
                    }
                    className={`w-full px-4 py-2 text-sm font-semibold rounded-lg border ${
                      formState.isActive
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {formState.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}
                  </button>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-semibold text-gray-700">Ảnh đại diện</label>
                  <input
                    value={formState.imageUrl}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, imageUrl: event.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-sm font-semibold text-gray-700">Đặc điểm nổi bật</label>
                <textarea
                  value={formState.featuresText}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, featuresText: event.target.value }))
                  }
                  placeholder="Mỗi dòng là một đặc điểm"
                  className="w-full h-24 px-4 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Giá dịch vụ</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-gray-500">
                      Tự lấy mẫu
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formState.selfSamplePrice}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, selfSamplePrice: event.target.value }))
                      }
                      disabled={formState.type === 1}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                    {formState.selfSamplePrice && (
                      <p className="mt-1 text-xs text-gray-500">
                        {formatCurrency(Number(formState.selfSamplePrice))}
                      </p>
                    )}
                    {formState.selfSamplePriceId && mode === 'edit' && (
                      <button
                        type="button"
                        onClick={() => handleDeletePrice(formState.selfSamplePriceId!)}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-red-600 hover:underline"
                      >
                        <Trash2 size={14} />
                        Xóa giá
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-semibold text-gray-500">
                      Thu mẫu tại cơ sở
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formState.facilityPrice}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, facilityPrice: event.target.value }))
                      }
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {formState.facilityPrice && (
                      <p className="mt-1 text-xs text-gray-500">
                        {formatCurrency(Number(formState.facilityPrice))}
                      </p>
                    )}
                    {formState.facilityPriceId && mode === 'edit' && (
                      <button
                        type="button"
                        onClick={() => handleDeletePrice(formState.facilityPriceId!)}
                        className="inline-flex items-center gap-1 mt-2 text-xs text-red-600 hover:underline"
                      >
                        <Trash2 size={14} />
                        Xóa giá
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {mode === 'create' ? <Plus size={16} /> : <Save size={16} />}
                  {saving
                    ? 'Đang lưu...'
                    : mode === 'create'
                    ? 'Tạo mới'
                    : 'Lưu thay đổi'}
                </button>
                <button
                  onClick={resetForm}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <XCircle size={16} />
                  Hủy
                </button>
                {mode === 'edit' && formState.id && (
                  <button
                    onClick={() => handleDeleteService(formState.id!)}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Xóa dịch vụ
                  </button>
                )}
              </div>

              {mode === 'create' && (
                <div className="flex items-center gap-2 mt-3 text-xs text-green-600">
                  <CheckCircle size={14} />
                  Dữ liệu sẽ được lưu trực tiếp lên Firebase.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
