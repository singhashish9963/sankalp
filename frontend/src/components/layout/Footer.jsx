export default function Footer() {
  return (
    <div className="w-full border-t bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} AI Career Copilot. All rights reserved.
        </div>
    </div>
  );
}