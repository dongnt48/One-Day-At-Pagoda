import * as T from "three";
export function makeCharacter(female = false) {
  const root = new T.Group();
  root.name = "Avatar";
  const cloth = new T.MeshStandardMaterial({
    color: "#8d9fa9",
    roughness: 0.95,
  });
  const skin = new T.MeshStandardMaterial({
    color: "#d4ab88",
    roughness: 0.95,
  });
  const hair = new T.MeshStandardMaterial({ color: "#2e2926", roughness: 1 });
  const shoes = new T.MeshStandardMaterial({ color: "#575247", roughness: 1 });
  function mesh(
    parent: T.Object3D,
    geo: T.BufferGeometry,
    mat: T.Material,
    pos: number[],
  ) {
    const m = new T.Mesh(geo, mat);
    m.position.set(pos[0], pos[1], pos[2]);
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  const body = new T.Group();
  body.name = "Body";
  body.position.y = 0.85;
  root.add(body);
  mesh(body, new T.CylinderGeometry(0.27, 0.34, 0.68, 8), cloth, [0, 0.33, 0]);
  mesh(body, new T.CylinderGeometry(0.12, 0.14, 0.08, 8), cloth, [0, 0.71, 0]);
  mesh(body, new T.SphereGeometry(0.23, 12, 10), skin, [0, 0.99, 0]);
  mesh(
    body,
    new T.SphereGeometry(0.237, 12, 8, 0, Math.PI * 2, 0, female ? 1.95 : 1.5),
    hair,
    [0, 1.01, -0.01],
  );
  if (female)
    mesh(body, new T.SphereGeometry(0.12, 8, 6), hair, [0, 1.0, -0.23]);
  for (const x of [-0.075, 0.075])
    mesh(body, new T.SphereGeometry(0.018, 6, 6), hair, [x, 1, 0.215]);
  for (const [name, x] of [
    ["LeftArm", -0.33],
    ["RightArm", 0.33],
  ] as const) {
    const arm = new T.Group();
    arm.name = name;
    arm.position.set(x, 0.57, 0);
    body.add(arm);
    mesh(
      arm,
      new T.CylinderGeometry(0.115, 0.1, 0.53, 8),
      cloth,
      [0, -0.24, 0],
    );
    mesh(arm, new T.SphereGeometry(0.085, 8, 6), skin, [0, -0.54, 0]);
  }
  for (const [name, x] of [
    ["LeftLeg", -0.16],
    ["RightLeg", 0.16],
  ] as const) {
    const leg = new T.Group();
    leg.name = name;
    leg.position.set(x, 0.85, 0);
    root.add(leg);
    mesh(leg, new T.CylinderGeometry(0.14, 0.12, 0.7, 8), cloth, [0, -0.35, 0]);
    mesh(leg, new T.BoxGeometry(0.25, 0.12, 0.36), shoes, [0, -0.78, 0.045]);
  }
  const track = (name: string, t: number[], v: number[]) =>
    name.includes("rotation")
      ? new T.QuaternionKeyframeTrack(
          name.split(".")[0] + ".quaternion",
          t,
          v.flatMap((a) =>
            new T.Quaternion()
              .setFromAxisAngle(
                name.endsWith("[z]")
                  ? new T.Vector3(0, 0, 1)
                  : new T.Vector3(1, 0, 0),
                a,
              )
              .toArray(),
          ),
        )
      : new T.VectorKeyframeTrack(
          name.split(".")[0] + ".position",
          t,
          v.flatMap((y) => [
            name.startsWith("LeftLeg")
              ? -0.16
              : name.startsWith("RightLeg")
                ? 0.16
                : 0,
            y,
            0,
          ]),
        );
  const neutral = () => [
    track("Body.rotation[x]", [0, 1], [0, 0]),
    track("Body.position[y]", [0, 1], [0.85, 0.85]),
    ...["LeftArm", "RightArm", "LeftLeg", "RightLeg"].map((n) =>
      track(n + ".rotation[x]", [0, 1], [0, 0]),
    ),
  ];
  const clip = (name: string, duration: number, tracks: T.KeyframeTrack[]) =>
    new T.AnimationClip(name, duration, tracks);
  root.animations = [
    clip("idle", 3, [
      ...neutral().filter((t) => t.name !== "Body.position"),
      track("Body.position[y]", [0, 1.5, 3], [0.85, 0.87, 0.85]),
    ]),
    clip("walk", 0.8, [
      track("LeftLeg.rotation[x]", [0, 0.4, 0.8], [-0.45, 0.45, -0.45]),
      track("RightLeg.rotation[x]", [0, 0.4, 0.8], [0.45, -0.45, 0.45]),
      track("LeftArm.rotation[x]", [0, 0.4, 0.8], [0.4, -0.4, 0.4]),
      track("RightArm.rotation[x]", [0, 0.4, 0.8], [-0.4, 0.4, -0.4]),
    ]),
    clip("wave", 2.2, [
      track(
        "RightArm.rotation[z]",
        [0, 0.3, 0.7, 1.1, 1.5, 1.9, 2.2],
        [0, 2.6, 2.1, 2.6, 2.1, 2.6, 0],
      ),
    ]),
    clip("bow", 2.2, [
      track("Body.rotation[x]", [0, 0.6, 1.6, 2.2], [0, 0.65, 0.65, 0]),
      track("LeftArm.rotation[x]", [0, 0.6, 1.6, 2.2], [0, -0.8, -0.8, 0]),
      track("RightArm.rotation[x]", [0, 0.6, 1.6, 2.2], [0, -0.8, -0.8, 0]),
    ]),
    clip("sit", 1, [
      track("Body.position[y]", [0, 1], [0.42, 0.42]),
      track("LeftLeg.position[y]", [0, 1], [0.42, 0.42]),
      track("RightLeg.position[y]", [0, 1], [0.42, 0.42]),
      track("LeftLeg.rotation[x]", [0, 1], [-1.25, -1.25]),
      track("RightLeg.rotation[x]", [0, 1], [-1.25, -1.25]),
    ]),
    clip("incense", 4, [
      track("LeftArm.rotation[x]", [0, 0.7, 3.3, 4], [0, -1.5, -1.5, 0]),
      track("RightArm.rotation[x]", [0, 0.7, 3.3, 4], [0, -1.5, -1.5, 0]),
      track("Body.rotation[x]", [0, 2, 4], [0, 0.25, 0]),
    ]),
    clip("sweep", 1, [
      track("Body.rotation[x]", [0, 1], [0.2, 0.2]),
      track("RightArm.rotation[x]", [0, 0.5, 1], [-0.5, -1.1, -0.5]),
      track("LeftArm.rotation[x]", [0, 0.5, 1], [-1.1, -0.5, -1.1]),
    ]),
    clip("water", 2, [
      track("RightArm.rotation[x]", [0, 1, 2], [-0.7, -1.1, -0.7]),
      track("Body.rotation[x]", [0, 1, 2], [0.1, 0.3, 0.1]),
    ]),
  ];
  return root;
}
