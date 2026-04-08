import '@/styles/globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
		<html lang='en'>
			<body>
				<main id='main-content'>{children}</main>
			</body>
		</html>
	);
}
