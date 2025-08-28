'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to crypto-catcher after 3 seconds
    const timer = setTimeout(() => {
      router.push('/crypto-catcher');
    }, 3000);

    // Cleanup timer on component unmount
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white-pattern flex items-center justify-center">
      <div className="text-center">
        {/* Loading Logo */}
        <div className="mb-8 animate-pulse">
          <Image
            src="/assets/logos/logo.svg"
            width={200}
            height={200}
            alt="Randamu Logo"
            className="mx-auto"
          />
        </div>
        
        {/* Loading Text */}
        <div className="space-y-4">
          <h2 className="font-funnel-display text-2xl md:text-3xl font-bold text-black">
            Loading Randamu...
          </h2>
          <p className="font-funnel-sans text-lg text-gray-500">
            Preparing your verifiable randomness experience
          </p>
          
          {/* Loading Spinner */}
          <div className="flex justify-center mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </div>

        {/* Game Roulette Promo */}
        <div className="mt-12 p-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl text-white max-w-md mx-auto">
          <h3 className="text-xl font-bold mb-3">🎰 New: Game Roulette!</h3>
          <p className="text-sm mb-4 text-purple-100">
            Experience unpredictable game switching powered by VRF randomness!
          </p>
          <Link 
            href="/game-roulette"
            className="inline-block bg-white text-purple-600 font-bold py-2 px-4 rounded-lg hover:bg-purple-50 transition-colors"
          >
            Try Game Roulette →
          </Link>
        </div>
      </div>
    </div>
  );
}







// 'use client';
// import Link from 'next/link';
// import Image from 'next/image';

// export default function Home() {
//   return (
//     <div className="min-h-screen bg-white-pattern">
//       {/* Hero Section */}
//       <section className="min-h-screen flex flex-col justify-between pb-10 md:pb-20">
//         <Link href="/">
//           <div className="container mx-auto px-4 md:px-16 pt-20 md:pt-32">
//             <Image
//               className="cursor-pointer"
//               src="/assets/logos/logo.svg"
//               width={150}
//               height={150}
//               alt="Randamu Logo"
//             />
//           </div>
//         </Link>
//         <div className="container mx-auto px-4 md:px-16">
//           <div className="pt-10 md:pt-20">
//             {/* Main Content */}
//             <div className="space-y-4 md:space-y-6 mb-10 md:mb-16">
//               <h1 className="font-funnel-display text-3xl md:text-5xl lg:text-7xl font-bold text-black max-w-4xl">
//                 Verifiable Randomness Starter Kit
//               </h1>
//               <p className="font-funnel-sans text-lg md:text-xl text-gray-500">
//                 Get trustless, on-chain RNG in just a few lines of code — powered by Randamu.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Tools Section */}
//         <div className="container mx-auto px-4 md:px-16">
//           <div className="flex flex-col md:flex-row items-center justify-between border-t border-gray-200 pt-6 md:pt-8 gap-4 md:gap-0">
//             <div className="flex items-center gap-2">
//               <span className="font-funnel-sans text-gray-900">Try out the Demos</span>
//             </div>
//             <div className="flex flex-col md:flex-row gap-2 md:gap-0 w-full md:w-auto">
//               <Link href="/randomnumber" className="w-full md:w-[200px]">
//                 <div className="w-full md:w-[200px] py-3 font-funnel-sans text-gray-900 border border-gray-200 hover:border-gray-400 transition-colors text-center">
//                   Verifiable RNG
//                 </div>
//               </Link>
//               <Link href="/coinflip" className="w-full md:w-[200px]">
//                 <div className="w-full md:w-[200px] py-3 font-funnel-sans text-gray-900 border border-gray-200 hover:border-gray-400 transition-colors text-center">
//                   Coin Flip
//                 </div>
//               </Link>
//               <Link href="/crypto-catcher" className="w-full md:w-[200px]">
//                 <div className="w-full md:w-[200px] py-3 font-funnel-sans text-gray-900 border border-gray-200 hover:border-gray-400 transition-colors text-center">
//                   Crypto Catcher
//                 </div>
//               </Link>
//               <Link href="/crypto-catcher-enhanced" className="w-full md:w-[200px]">
//                 <div className="w-full md:w-[200px] py-3 font-funnel-sans text-white bg-gradient-to-r from-purple-600 to-blue-600 border border-purple-400 hover:border-purple-500 transition-colors text-center">
//                   🎯 VRF Enhanced
//                 </div>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-black-pattern text-white py-8 md:py-12">
//         <div className="container mx-auto px-4">
//           <div className="flex flex-col md:flex-row justify-between items-center gap-6 md:gap-0">
//             <div className="text-center md:text-left">
//               <Image
//                 className="cursor-pointer"
//                 src="/assets/logos/lightLogo.svg"
//                 width={150}
//                 height={150}
//                 alt="Randamu Logo"
//               />
//               <p className="font-funnel-sans text-gray-400 mt-2">Verifiable Randomness for Web3</p>
//             </div>
//             <div className="flex space-x-6">
//               <a href="https://docs.randa.mu/" target="_blank" className="text-gray-400 hover:text-white transition-colors duration-300">
//                 Documentation
//               </a>
//               <a href="https://github.com/randa-mu" target="_blank" className="text-gray-400 hover:text-white transition-colors duration-300">
//                 GitHub
//               </a>
//               <a href="https://x.com/RandamuInc/" target="_blank" className="text-gray-400 hover:text-white transition-colors duration-300">
//                 Twitter
//               </a>
//             </div>
//           </div>
//           <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-gray-800 text-center">
//             <p className="font-funnel-sans text-gray-400">
//               Built with ❤️ by FIL-B
//             </p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }
