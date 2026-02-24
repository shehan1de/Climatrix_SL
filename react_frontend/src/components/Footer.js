const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-glass">
        <h6 className="brand-gradient footer-brand">
          Climatrix SL
        </h6>

        <p className="footer-copy">
          © {new Date().getFullYear()} Climatrix SL. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
