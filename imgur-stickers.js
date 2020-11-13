/* global BdApi */

(() => {
  // this can be public.
  // right?
  // right?????
  const IMGUR_CLIENT_ID = "2be59afdb459916";

  function log(msg, attr = "log") {
    console[attr]("%c[stickers]%c", "color: blue; font-weight: 700", "", msg);
  }

  BdApi.injectCSS(
    "liang-imgur-stickers-css",
    `
    .l-opacity-75 {
      opacity: 0.75;
    }

    .h\\:l-opacity-100:hover {
      opacity: 1;
    }
    `
  );

  const { React } = BdApi;

  const e = React.createElement;

  function App() {
    const buttonEl = React.useRef(null);
    const menuEl = React.useRef(null);
    const inputDebounce = React.useRef(null);
    const [albumID, setAlbumID] = React.useState("");
    const [albumIDDebounced, setAlbumIDDebounced] = React.useState("");
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [menuPlacement, setMenuPlacement] = React.useState({ x: 0, y: 0 });
    const [buttonPlacement, setButtonPlacement] = React.useState({
      x: 0,
      y: 0,
    });
    const [imageLinks, setImageLinks] = React.useState({ err: null, ok: [] });

    React.useEffect(() => {
      fetch(`https://api.imgur.com/3/album/${albumIDDebounced}`, {
        method: "GET",
        headers: {
          Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            return json.data.images.map((i) => i.link);
          }
          throw new Error(json);
        })
        .then((links) => setImageLinks({ err: null, ok: links }))
        .catch((err) => {
          setImageLinks({ err, ok: null });
          log(err, "error");
        });
    }, [albumIDDebounced]);

    React.useEffect(() => {
      function stayInPlace() {
        const textarea = document.querySelector("[class^=channelTextArea]");

        if (textarea) {
          const menuRect = textarea.getBoundingClientRect();
          setMenuPlacement({ x: menuRect.right, y: menuRect.top });
        }

        const textareaButtons = document.querySelector(
          "[class^=channelTextArea] [class^=buttons]"
        );

        if (textareaButtons) {
          const buttonRect = textareaButtons.getBoundingClientRect();
          setButtonPlacement({ x: buttonRect.left, y: buttonRect.top });
        }
      }

      window.addEventListener("resize", stayInPlace);
      stayInPlace();

      return () => {
        window.removeEventListener("resize", stayInPlace);
      };
    }, []);

    React.useEffect(() => {
      function closeMenuOnOutsideClick(event) {
        if (buttonEl.current === null || menuEl.current === null) {
          return;
        }

        if (
          !buttonEl.current.contains(event.target) &&
          !menuEl.current.contains(event.target)
        ) {
          setMenuOpen(false);
        }
      }

      document.addEventListener("click", closeMenuOnOutsideClick);

      return () => {
        document.removeEventListener("click", closeMenuOnOutsideClick);
      };
    }, []);

    return e("div", { style: { position: "absolute", zIndex: 50 } }, [
      e(
        "button",
        {
          ref: buttonEl,
          type: "button",
          onClick: () => setMenuOpen((prev) => !prev),
          style: {
            left: buttonPlacement.x - 100,
            top: buttonPlacement.y,
            position: "absolute",
          },
        },
        "hi"
      ),
      e(
        "div",
        {
          ref: menuEl,
          style: (() => {
            const w = 500;
            const h = 500;
            const margin = 8;
            const pad = 8;
            // the menu placement (relative to textarea) is off by 71px to the
            // right. idk why. just hardcode it because I spent too much time
            // pulling my hair trying to find out why.
            const weirdMagicOffset = 71;

            return {
              display: menuOpen ? "block" : "none",
              position: "absolute",
              overflowY: "auto",
              left: menuPlacement.x - w - margin - pad * 2 - weirdMagicOffset,
              top: menuPlacement.y - h - margin - pad * 2,
              width: w,
              height: h,
              backgroundColor: "var(--background-secondary)",
              borderRadius: 8,
              boxShadow: "var(--elevation-stroke), var(--elevation-high)",
              padding: pad,
            };
          })(),
        },
        [
          e(
            "div",
            { style: { display: "flex", paddingBottom: 8 } },
            e(
              "input",
              {
                type: "text",
                value: albumID,
                onChange: (event) => {
                  if (inputDebounce.current !== null) {
                    clearTimeout(inputDebounce.current);
                  }

                  const { value } = event.target;

                  inputDebounce.current = setTimeout(() => {
                    setAlbumIDDebounced(value);
                  }, 1000);

                  setAlbumID(value);
                  setImageLinks({ err: null, ok: [] });
                },
                placeholder: "Imgur album ID",
                style: {
                  borderWidth: 0,
                  borderRadius: 4,
                  backgroundColor: "var(--background-tertiary)",
                  color: "var(--text-normal)",
                  width: "100%",
                  padding: "8px 12px",
                },
              },
              null
            )
          ),
          (() => {
            if (imageLinks.err) {
              return e(
                "div",
                { style: { display: "flex", justifyContent: "center" } },
                e(
                  "p",
                  {
                    style: {
                      color: "var(--text-normal)",
                      textAlign: "center",
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      paddingTop: 200,
                      width: 300,
                    },
                  },
                  "There was an error fetching images. Is the album ID correct?"
                )
              );
            }

            return e(
              "ul",
              {
                style: {
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: 16,
                },
              },
              imageLinks.ok.map((link) =>
                e(
                  "li",
                  {
                    key: link,
                    style: { display: "flex", justifyContent: "center" },
                  },
                  e(
                    "button",
                    {
                      type: "button",
                      onclick: () => {},
                      style: {
                        backgroundColor: "transparent",
                        transition: "opacity 150ms",
                      },
                      className: "l-opacity-75 h:l-opacity-100",
                    },
                    e(
                      "img",
                      {
                        src: link,
                        style: {
                          width: "100%",
                          height: 80,
                          objectFit: "contain",
                        },
                      },
                      null
                    )
                  )
                )
              )
            );
          })(),
        ]
      ),
    ]);
  }

  function mount() {
    const appId = "liang-imgur-stickers-app";

    log("mount()");

    if (document.querySelector(appId)) {
      log("already mounted. aborting", "warn");
      return;
    }

    const target = document.querySelector(
      "[class*=baseLayer] > [class*=container] > [class*=base]"
    );

    if (!target) {
      setTimeout(mount, 500);
      return;
    }

    log("mounting app");
    const applicationContainer = document.createElement("div");
    applicationContainer.id = appId;
    target.prepend(applicationContainer);
    BdApi.ReactDOM.render(e(App, {}, null), applicationContainer);
  }

  mount();
})();
