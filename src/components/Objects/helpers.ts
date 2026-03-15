import * as THREE from 'three'

/** Recursively set castShadow / receiveShadow on all meshes in an object. */
export function enableShadows(obj: THREE.Object3D, cast: boolean, receive: boolean) {
  obj.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = cast
      child.receiveShadow = receive
    }
  })
}
