import Logo from '@/components/icons/Logo';

export default function Footer() {
  return (
    <footer aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="wrapper wrapper-sm py-8">
        <div>
          <div className="space-y-5">
            <Logo className="h-6 w-auto grayscale"/>
            <p className="text-gray-500 text-base">
              Create a privacy-friendly referral program for your SaaS.
            </p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-gray-500 text-sm">&copy; 2022 Reflio (McIlroy Limited).</p>
          {/* <div className="flex items-center justify-start mt-2">
            <a href="/privacy" className="hover:underline text-xs mx-1 text-gray-500 hover:text-gray-400">Privacy</a>
            <a href="/terms" className="hover:underline text-xs mx-1 text-gray-500 hover:text-gray-400">Terms</a>
            <a href="/changelog" className="hover:underline text-xs mx-1 text-gray-500 hover:text-gray-400">Changelog</a>
          </div> */}
        </div>
      </div>
    </footer>
  );
}