import Link from "next/link";

const links = [
  ["/dashboard", "Dashboard"],
  ["/assistant", "Assistant"],
  ["/inventory", "Inventory"],
  ["/customers", "Customers"],
  ["/payments", "Payments"],
];

export default function Nav() {
  return (
    <nav style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "16px 24px", borderBottom: "1px solid #333", marginBottom: 24 }}>
      <strong style={{ marginRight: 8 }}>AI Saathi</strong>
      {links.map(([href, label]) => (
        <Link key={href} href={href} style={{ color: "#fff", opacity: 0.85, textDecoration: "none" }}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
