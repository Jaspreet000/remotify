"use client"
import { forwardRef, useRef } from "react";
import { useGLTF, useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type ModelProps = {
  position: [number, number, number];
  rotation: [number, number, number];
};

const Model = forwardRef<THREE.Group, ModelProps>(({ position, rotation }, ref) => {
  const model = useGLTF("/models/old_computers.glb");
  const modelRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  useFrame(() => {
    const currentRef = (ref || modelRef.current) as THREE.Group;
    if (!currentRef) return;

    const scrollProgress = scroll.offset;
    const elapsedTime = scrollProgress * 5;

    // Rotation
    currentRef.rotation.y = elapsedTime * Math.PI;

    // Scaling
    const zoomLevel = THREE.MathUtils.lerp(1.5, 3, scrollProgress);
    currentRef.scale.set(zoomLevel, zoomLevel, zoomLevel);

    // Position changes for parallax effect
    if (scrollProgress < 0.2) {
      currentRef.position.set(
        THREE.MathUtils.lerp(0, -2, scrollProgress * 5),
        position[1],
        position[2]
      );
    } else if (scrollProgress < 0.4) {
      currentRef.position.set(
        THREE.MathUtils.lerp(-2, 2, (scrollProgress - 0.2) * 5),
        position[1] + 0.5,
        position[2] - 1
      );
    } else if (scrollProgress < 0.6) {
      currentRef.position.set(
        THREE.MathUtils.lerp(2, 0, (scrollProgress - 0.4) * 5),
        position[1] + 1,
        position[2] - 2
      );
    } else {
      currentRef.position.set(0, position[1], position[2] - 3);
    }

    // Vertical bounce
    currentRef.position.y = position[1] + Math.sin(elapsedTime * 2) * 0.1;
  });

  return <primitive ref={ref || modelRef} object={model.scene} />;
});

useGLTF.preload("/models/old_computers.glb");

export default Model;
