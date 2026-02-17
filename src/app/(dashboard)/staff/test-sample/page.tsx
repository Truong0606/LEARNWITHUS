'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from '@/components/dashboard';
import { Loading } from '@/components/shared';
import { Search, Filter, Eye, Edit, Plus } from 'lucide-react';

interface TestSample {
  id: string;
  sampleCode: string;
  donorName: string;
  sampleType: string;
  status: 'pending' | 'collected' | 'received' | 'testing' | 'completed';
  collectedAt?: string;
  bookingCode: string;
}

const mockSamples: TestSample[] = [
  {
    id: '1',
    sampleCode: 'SP001',
    donorName: 'Nguyễn Văn A',
    sampleType: 'Tăm bông miệng',
    status: 'pending',
    bookingCode: 'BK1001',
  },
  {
    id: '2',
    sampleCode: 'SP002',
    donorName: 'Trần Thị B',
    sampleType: 'Máu',
    status: 'collected',
    collectedAt: '2025-01-02',
    bookingCode: 'BK1001',
  },
  {
    id: '3',
    sampleCode: 'SP003',
    donorName: 'Lê Văn C',
    sampleType: 'Tóc có chân',
    status: 'received',
    collectedAt: '2025-01-01',
    bookingCode: 'BK1002',
  },
  {
    id: '4',
    sampleCode: 'SP004',
    donorName: 'Phạm Thị D',
    sampleType: 'Móng tay',
    status: 'testing',
    collectedAt: '2024-12-30',
    bookingCode: 'BK1003',
  },
  {
    id: '5',
    sampleCode: 'SP005',
    donorName: 'Hoàng Văn E',
    sampleType: 'Nước bọt',
    status: 'completed',
    collectedAt: '2024-12-28',
    bookingCode: 'BK1004',
  },
];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ lấy mẫu', color: 'bg-yellow-100 text-yellow-700' },
  collected: { label: 'Đã lấy mẫu', color: 'bg-blue-100 text-blue-700' },
  received: { label: 'Đã nhận mẫu', color: 'bg-purple-100 text-purple-700' },
  testing: { label: 'Đang xét nghiệm', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
};

export default function TestSamplePage() {
  const [samples, setSamples] = useState<TestSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSamples(mockSamples);
      } catch (error) {
        console.error('Error loading samples:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredSamples = samples.filter((sample) => {
    const matchesSearch =
      sample.sampleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sample.bookingCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sample.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="large" message="Đang tải danh sách mẫu..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader title="Quản lí mẫu xét nghiệm" />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <input
                type="text"
                placeholder="Tìm kiếm mẫu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter size={18} className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full py-2 pl-10 pr-8 text-sm border border-gray-300 rounded-lg appearance-none sm:w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ lấy mẫu</option>
                <option value="collected">Đã lấy mẫu</option>
                <option value="received">Đã nhận mẫu</option>
                <option value="testing">Đang xét nghiệm</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
            <Plus size={18} />
            Thêm mẫu mới
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Mã mẫu
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Người cho mẫu
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Loại mẫu
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Mã booking
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Ngày lấy mẫu
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSamples.map((sample) => (
                <tr key={sample.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-blue-600 whitespace-nowrap">
                    {sample.sampleCode}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {sample.donorName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {sample.sampleType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {sample.bookingCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        statusConfig[sample.status].color
                      }`}
                    >
                      {statusConfig[sample.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {sample.collectedAt || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-right whitespace-nowrap">
                    <button className="p-1 text-gray-400 hover:text-blue-600">
                      <Eye size={18} />
                    </button>
                    <button className="p-1 ml-2 text-gray-400 hover:text-green-600">
                      <Edit size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSamples.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-gray-500">Không tìm thấy mẫu xét nghiệm nào</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Hiển thị {filteredSamples.length} / {samples.length} mẫu
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
              Trước
            </button>
            <button className="px-3 py-1 text-sm text-white bg-blue-600 rounded">
              1
            </button>
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

