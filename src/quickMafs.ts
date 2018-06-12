/*
x=cos(a)
y=sin(a)
*/

export function getVelY(angle: number): number {
  return parseInt(
    (Math.cos(angle * Math.PI / 180) * -1).toFixed(4),
    10,
  );
}

export function getVelX(angle: number): number {
  return parseInt(
    (Math.sin(angle * Math.PI / 180)).toFixed(4),
    10,
  );
}
