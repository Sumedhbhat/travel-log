const fetchOriginal = globalThis.fetch;
globalThis.fetch = async (input, options) => {
  const request = new Request(input, options);
  const url = new URL(request.url);
  if (url.hostname === "github.com" && url.pathname === "/login/oauth/access_token") {
    const body = new URLSearchParams(await request.text());
    if (body.get("code") !== "local-fixture-code")
      throw new Error("Unexpected OAuth code");
    return Response.json({ access_token: "local-fixture-access-token", token_type: "bearer", scope: "read:user,user:email" });
  }
  if (url.hostname === "api.github.com" && url.pathname === "/user") {
    return Response.json({ id: 424242, login: "local-fixture-user", name: "Local Fixture", email: "fixture@example.invalid", avatar_url: null });
  }
  if (url.hostname === "api.github.com" && url.pathname === "/user/emails") {
    return Response.json([{ email: "fixture@example.invalid", primary: true, verified: true, visibility: "private" }]);
  }
  if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost")
    throw new Error(`Unexpected external request: ${url.hostname}`);
  return fetchOriginal(input, options);
};
