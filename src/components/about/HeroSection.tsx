import { Heart, ShieldCheck, Users } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative py-16 md:py-20 bg-blue-50 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight text-blue-900">
            <span className="block text-3xl md:text-5xl mt-2 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              ADN Huyết Thống
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed text-blue-700">
            Trung tâm xét nghiệm ADN huyết thống hàng đầu Việt Nam với công nghệ tiên tiến 
            và đội ngũ chuyên gia y tế giàu kinh nghiệm
          </p>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-200/50 rounded-full flex items-center justify-center group-hover:bg-blue-300/50 transition-colors duration-300">
                  <Users className="w-8 h-8 text-blue-900" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-2 text-blue-900">15+</div>
              <div className="text-blue-600">Năm Kinh Nghiệm</div>
            </div>

            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-200/50 rounded-full flex items-center justify-center group-hover:bg-blue-300/50 transition-colors duration-300">
                  <ShieldCheck className="w-8 h-8 text-blue-900" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-2 text-blue-900">99.9%</div>
              <div className="text-blue-600">Độ Chính Xác</div>
            </div>

            <div className="text-center group">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-200/50 rounded-full flex items-center justify-center group-hover:bg-blue-300/50 transition-colors duration-300">
                  <Heart className="w-8 h-8 text-blue-900" />
                </div>
              </div>
              <div className="text-3xl font-bold mb-2 text-blue-900">50,000+</div>
              <div className="text-blue-600">Khách Hàng Tin Tưởng</div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 w-4 h-4 bg-blue-300/30 rounded-full animate-bounce"></div>
      <div className="absolute top-1/3 right-16 w-6 h-6 bg-blue-400/30 rounded-full animate-pulse"></div>
      <div className="absolute bottom-1/4 left-1/4 w-3 h-3 bg-blue-500/30 rounded-full animate-ping"></div>
    </section>
  );
}
