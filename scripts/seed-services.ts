import { COLLECTIONS } from '../src/lib/firebase/admin';
import { createDocument } from '../src/lib/firebase/firestore';
import { SampleCollectionMethod, TestServiceType } from '../src/types';

interface SeedService {
  name: string;
  description: string;
  sampleCount: number;
  type: TestServiceType;
  imageUrl: string;
  features: string[];
  prices: Array<{
    price: number;
    collectionMethod: SampleCollectionMethod;
  }>;
}

const services: SeedService[] = [
  {
    name: 'Xét nghiệm ADN Cha Con',
    description: 'Xác định quan hệ huyết thống giữa cha và con với độ chính xác 99.99%',
    sampleCount: 2,
    type: TestServiceType.Civil,
    imageUrl: 'https://i.postimg.cc/YSFzZ4VZ/9e0e121abaf50eab57e4.jpg',
    features: ['Kết quả 3-5 ngày', 'Lấy mẫu tại nhà', 'Bảo mật tuyệt đối'],
    prices: [
      {
        price: 3500000,
        collectionMethod: SampleCollectionMethod.SelfSample,
      },
    ],
  },
  {
    name: 'Xét nghiệm ADN Pháp lý',
    description: 'Xét nghiệm ADN cho mục đích pháp lý, có giá trị trước tòa án',
    sampleCount: 2,
    type: TestServiceType.Legal,
    imageUrl: 'https://i.postimg.cc/YSFzZ4VZ/9e0e121abaf50eab57e4.jpg',
    features: ['Có giá trị pháp lý', 'Lấy mẫu tại cơ sở', 'Công chứng kết quả'],
    prices: [
      {
        price: 5500000,
        collectionMethod: SampleCollectionMethod.AtFacility,
      },
    ],
  },
  {
    name: 'Xét nghiệm Quan hệ Họ hàng',
    description: 'Xác định quan hệ huyết thống giữa anh chị em, ông bà và cháu',
    sampleCount: 2,
    type: TestServiceType.Civil,
    imageUrl: 'https://i.postimg.cc/YSFzZ4VZ/9e0e121abaf50eab57e4.jpg',
    features: ['Độ chính xác cao', 'Bảo mật thông tin', 'Hỗ trợ tư vấn 24/7'],
    prices: [
      {
        price: 4500000,
        collectionMethod: SampleCollectionMethod.SelfSample,
      },
    ],
  },
  {
    name: 'Xét nghiệm ADN Thai nhi',
    description: 'Xác định huyết thống khi thai nhi còn trong bụng mẹ, an toàn và không xâm lấn',
    sampleCount: 2,
    type: TestServiceType.Legal,
    imageUrl: 'https://i.postimg.cc/YSFzZ4VZ/9e0e121abaf50eab57e4.jpg',
    features: ['An toàn 100%', 'Không xâm lấn', 'Kết quả chính xác'],
    prices: [
      {
        price: 8500000,
        collectionMethod: SampleCollectionMethod.AtFacility,
      },
    ],
  },
];

async function seedServices(): Promise<void> {
  console.log('🔧 Seeding test services...');

  for (const service of services) {
    const serviceId = await createDocument(COLLECTIONS.testServices, {
      name: service.name,
      description: service.description,
      sampleCount: service.sampleCount,
      type: service.type,
      isActive: true,
      imageUrl: service.imageUrl,
      features: service.features,
    });

    for (const price of service.prices) {
      await createDocument(COLLECTIONS.servicePrices, {
        serviceId,
        price: price.price,
        collectionMethod: price.collectionMethod,
        effectiveFrom: new Date(),
        effectiveTo: null,
      });
    }

    console.log(`✅ Created service ${service.name} (${serviceId})`);
  }
}

seedServices()
  .then(() => {
    console.log('🎉 Seed completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed error:', error);
    process.exit(1);
  });
