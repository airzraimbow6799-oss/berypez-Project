import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { isGoogleMapsEmbed } from "@/config/site";

import { BranchMap } from "./BranchMap";

const EMBED = "https://www.google.com/maps/embed?pb=!1m18!test";

describe("BranchMap", () => {
  it("no carga Google Maps hasta que la persona toca «Ver mapa»", () => {
    render(<BranchMap branchName="Lince" embedUrl={EMBED} />);
    expect(screen.queryByTitle("Mapa de la sede Lince")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /ver mapa de lince/i }));

    const iframe = screen.getByTitle("Mapa de la sede Lince");
    expect(iframe).toHaveAttribute("src", EMBED);
    expect(iframe).toHaveAttribute("loading", "lazy");
  });
});

describe("isGoogleMapsEmbed", () => {
  it("acepta solo el iframe oficial de Google Maps", () => {
    expect(isGoogleMapsEmbed(EMBED)).toBe(true);
    expect(isGoogleMapsEmbed(null)).toBe(false);
    expect(isGoogleMapsEmbed("https://maps.app.goo.gl/abc")).toBe(false);
    expect(isGoogleMapsEmbed("https://evil.example/maps/embed?pb=1")).toBe(false);
    expect(isGoogleMapsEmbed("javascript:alert(1)")).toBe(false);
  });
});
