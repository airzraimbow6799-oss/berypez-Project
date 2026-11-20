import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PressVideo } from "./PressVideo";

describe("PressVideo", () => {
  it("muestra solo la miniatura y carga YouTube (sin cookies) al tocar", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PressVideo
        id="XCIKhFdI380"
        title="La sobremesa electoral"
        outlet="RPP Noticias"
        dateLabel="Enero 2020"
      />,
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByText("RPP Noticias · Enero 2020")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Ver «La sobremesa electoral» de RPP Noticias" }),
    );

    const iframe = container.querySelector("iframe");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/XCIKhFdI380?autoplay=1&rel=0",
    );
    expect(iframe).toHaveAttribute("title", "La sobremesa electoral (RPP Noticias)");
  });
});
