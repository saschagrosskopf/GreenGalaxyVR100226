import React, { useEffect, useState, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, Text, Box, Sphere, Gltf, Cylinder, RoundedBox } from '@react-three/drei';
import { api, SceneObject } from '../../services/api';
import { BoardroomFurniture, StudioFurniture, FullOfficeLayout, ZenFurniture, ExpoFurniture } from './Furniture';
import { SmartScreen } from './SmartScreen';
import Avatar from './Avatar';
import { RoomConfig, AppMode, Asset, User } from '../../../types';
// @ts-ignore
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
// @ts-ignore
import { db } from '../../logic.js';

interface Props {
  templateId?: string;
  config: RoomConfig;
  assets?: Asset[];
  user: User | undefined;
  hasEntered: boolean; 
  spaceId?: string;
  activeTool?: 'cursor' | 'sticky' | 'sticker' | 'eraser';
  toolPayload?: string;
}

export const Room: React.FC<Props> = ({ templateId = 'template_boardroom', config, assets, user, hasEntered, spaceId, activeTool, toolPayload }) => {
  const { camera } = useThree();
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const primaryColor = config.wallColor || '#06B6D4';
  
  const myId = useRef(sessionStorage.getItem('gg_player_id') || 'player_' + Math.random().toString(36).substr(2, 9));
  const lastBroadcast = useRef(0);

  // 1. DATA SYNC & AUTO-REPAIR
  useEffect(() => {
    if (!spaceId) return;
    
    const objectsRef = collection(db, 'spaces', spaceId, 'sceneObjects');
    const q = query(objectsRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot: any) => {
      // === AUTO HYDRATION LOGIC ===
      if (snapshot.empty && isLoading) {
         console.log("⚠️ Room is empty. Attempting auto-repair...");
         
         // A. Is it a Fixed Seed? -> Load Template
         let tid = null;
         if (spaceId === 'seed_boardroom') tid = 'template_boardroom';
         else if (spaceId === 'seed_studio') tid = 'template_studio';
         else if (spaceId === 'seed_zen') tid = 'template_zen';
         else if (spaceId === 'seed_mall') tid = 'template_mall';
         else if (templateId && templateId !== 'custom') tid = templateId;
         
         if (tid) {
             await api.spaces.hydrateSpace(spaceId, tid);
         }
         // B. Is it a Custom Space with Assets? -> Load GLB
         else if (assets && assets.length > 0) {
             console.log("📂 Loading Custom GLB Assets...");
             for (const asset of assets) {
                 if (asset.type === 'model') {
                     await api.scenes.addSceneObject(spaceId, { 
                         type: 'model', 
                         url: asset.url, 
                         title: asset.name, 
                         pos: {x:0, y:0, z:0},
                         size: {w:1, h:1, d:1}
                     });
                 }
             }
         }
      }
      // ===========================

      const objs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setSceneObjects(objs);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [spaceId, templateId, assets]);

  // 2. INTERACTION HANDLERS
  const handleObjectClick = async (e: any, obj: any) => {
      e.stopPropagation();
      if (obj.type === 'teleport' && obj.target) {
          camera.position.set(obj.target.x, obj.target.y, obj.target.z);
          return;
      }
      if (activeTool === 'eraser') {
          if (confirm("Delete object?")) {
              await deleteDoc(doc(db, 'spaces', spaceId!, 'sceneObjects', obj.id));
          }
      }
  };

  const handleFloorClick = async (e: any) => {
    if (!spaceId || !activeTool || activeTool === 'cursor') return;
    e.stopPropagation();
    const { x, y, z } = e.point;

    if (activeTool === 'sticky') {
        const text = prompt("Note:", toolPayload || "Idea");
        if (text) {
            await api.scenes.addSceneObject(spaceId, { 
                type: 'sticky_note', 
                pos: {x, y: y+0.5, z}, 
                title: text, 
                color: '#ffeaa7' 
            });
        }
    }

    if (activeTool === 'sticker') {
         await api.scenes.addSceneObject(spaceId, { 
             type: 'sticker', 
             pos: {x, y: y+0.5, z}, 
             content: toolPayload || '🚀' 
         });
    }
  };

  // 3. MULTIPLAYER POSITION SYNC
  useFrame(() => {
    if (!hasEntered) return;
    const now = Date.now();
    if (now - lastBroadcast.current > 100) { 
        lastBroadcast.current = now;
        api.multiplayer.updatePosition(myId.current, {
            name: user?.name || `Guest`, 
            color: primaryColor,
            position: [camera.position.x, camera.position.y, camera.position.z],
            rotation: [camera.rotation.x, camera.rotation.y, camera.rotation.z]
        });
    }
  });

  return (
    <group>
      <gridHelper args={[200, 200, 0xdddddd, 0xeeeeee]} position={[0, 0.01, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onClick={handleFloorClick}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#F5F5F7" opacity={0.5} transparent />
      </mesh>

      {/* RENDER LOOP */}
      {sceneObjects.map((obj) => {
         const pos: [number, number, number] = [obj.pos.x, obj.pos.y, obj.pos.z];
         const rot: [number, number, number] = [(obj.rot?.x||0)*Math.PI/180, (obj.rot?.y||0)*Math.PI/180, (obj.rot?.z||0)*Math.PI/180];

         // CUSTOM GLB MODEL
         if (obj.type === 'model' && obj.url) {
             return (
                 <group key={obj.id} position={pos} rotation={rot}>
                     <Gltf src={obj.url} scale={1} onClick={(e) => handleObjectClick(e, obj)} castShadow receiveShadow />
                     <Text position={[0, 2, 0]} fontSize={0.2} color="black" textAlign="center">{obj.title}</Text>
                 </group>
             );
         }

         // SMART SCREEN (Workspace Integration)
         if (obj.type === 'screen') {
             // Map database content strings to AppMode enum
             const modeMap: Record<string, AppMode> = { 
                'DASHBOARD': AppMode.DASHBOARD, 
                'DOCS': AppMode.DOCS, 
                'CALENDAR': AppMode.CALENDAR, 
                'MAIL': AppMode.MAIL 
             };
             const screenMode = modeMap[obj.content || ''] || AppMode.DASHBOARD;
             return (
                <SmartScreen 
                    key={obj.id} 
                    position={pos} 
                    rotation={rot} 
                    size={[obj.size?.w||8, obj.size?.h||4.5]} 
                    mode={screenMode}
                    accentColor={obj.color||primaryColor} 
                    title={obj.title||'SYSTEM'} 
                />
             );
         }

         // WORKSHOP STICKY NOTE
         if (obj.type === 'sticky_note') {
             return (
                 <group key={obj.id} position={pos} rotation={rot} onClick={(e) => handleObjectClick(e, obj)}>
                     <Box args={[0.8, 0.05, 0.8]} castShadow><meshStandardMaterial color={obj.color || '#ffeaa7'} /></Box>
                     <Text position={[0, 0.03, 0]} rotation={[-Math.PI/2, 0, 0]} fontSize={0.1} color="black" maxWidth={0.7} textAlign="center">{obj.title}</Text>
                 </group>
             );
         }

         // FUN STICKER
         if (obj.type === 'sticker') {
             return (
                 <group key={obj.id} position={pos} rotation={rot} onClick={(e) => handleObjectClick(e, obj)}>
                     <Html position={[0, 0.5, 0]} center transform sprite><div style={{ fontSize: '100px', pointerEvents: 'none' }}>{obj.content}</div></Html>
                 </group>
             );
         }

         // STANDARD FURNITURE
         if (obj.type === 'box') return <Box key={obj.id} position={pos} args={[obj.size?.w||1, obj.size?.h||1, obj.size?.d||1]} onClick={(e)=>handleObjectClick(e,obj)}><meshStandardMaterial color={obj.color||primaryColor} /></Box>;
         if (obj.type === 'cylinder') return <Cylinder key={obj.id} position={pos} args={[obj.size?.r||0.5, obj.size?.r||0.5, obj.size?.h||1]} onClick={(e)=>handleObjectClick(e,obj)}><meshStandardMaterial color={obj.color||primaryColor} /></Cylinder>;
         if (obj.type === 'sphere') return <Sphere key={obj.id} position={pos} args={[obj.size?.r || 0.5, 32, 32]} onClick={(e)=>handleObjectClick(e,obj)}><meshStandardMaterial color={obj.color || primaryColor} metalness={0.8} roughness={0.2} /></Sphere>;
         
         // BOARDS & ZONES
         if (obj.type === 'board_col') {
             return (
                 <group key={obj.id} position={pos} rotation={rot} onClick={(e) => handleObjectClick(e, obj)}>
                     <Box args={[obj.size?.w||6, obj.size?.h||8, 0.1]}><meshStandardMaterial color={obj.color} transparent opacity={0.7} /></Box>
                     <Text position={[0, (obj.size?.h||8)/2 + 0.3, 0.1]} fontSize={0.4} color="white" outlineWidth={0.02} outlineColor="black">{obj.title}</Text>
                 </group>
             );
         }
         if (obj.type === 'floor_zone') {
             return (
                 <group key={obj.id} position={pos} rotation={rot}>
                     <mesh><planeGeometry args={[obj.size?.w||10, obj.size?.h||10]} /><meshStandardMaterial color={obj.color} transparent opacity={0.3} /></mesh>
                     <Text position={[0, 0.1, 0]} fontSize={0.8} color="#333" rotation={[-Math.PI/2, 0, 0]}>{obj.title}</Text>
                 </group>
             );
         }
         
         // TELEPORTERS
         if (obj.type === 'teleport') {
             return (
                 <group key={obj.id} position={pos} onClick={(e) => handleObjectClick(e, obj)}>
                     <Cylinder args={[1, 1, 0.05]}><meshStandardMaterial color={obj.color||'#00cec9'} opacity={0.5} transparent /></Cylinder>
                     <Text position={[0, 1, 0]} fontSize={0.4} color="white" outlineWidth={0.02} outlineColor="black">{obj.label}</Text>
                 </group>
             );
         }

         return null;
      })}

      {/* Branded Fixed Overlays (Templates Only) */}
      {templateId === 'template_boardroom' && <BoardroomFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
      {templateId === 'template_studio' && <StudioFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
      {templateId === 'template_zen' && <ZenFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
      {templateId === 'template_mall' && <ExpoFurniture accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
      {templateId === 'template_full_office' && <FullOfficeLayout accentColor={primaryColor} furnitureMap={config.furnitureMap} />}
      
    </group>
  );
};