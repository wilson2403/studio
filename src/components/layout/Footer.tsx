export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex items-center justify-center h-16">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} El Artesanat Sanador. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
