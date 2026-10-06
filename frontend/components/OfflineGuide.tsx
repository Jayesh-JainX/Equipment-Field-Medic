'use client';

import React from 'react';
import { BookOpen, ShieldAlert, Sparkles, Zap } from 'lucide-react';
import { RepairProtocol } from '../lib/api';

interface OfflineGuideProps {
  onSelectQuickRepair: (preset: RepairProtocol) => void;
}

const OFFLINE_REPAIRS: { title: string; subtitle: string; protocol: RepairProtocol }[] = [
  {
    title: 'Snapped Tent Pole Splinting',
    subtitle: 'High wind structural failure fix',
    protocol: {
      equipmentName: 'Tent Pole (Splint Protocol)',
      identifiedMaterial: 'Aluminum 7001 / Fiberglass',
      confidenceScore: 0.98,
      issueDescription: 'Clean longitudinal fracture near ferrule',
      durabilityRating: 'High Durability (Multi-day)',
      requiredTools: ['Duct Tape', 'Splint Stick / Repair Sleeve', 'Multi-tool'],
      steps: [
        {
          stepNumber: 1,
          title: 'Trim Sharp Edges & Flush Align',
          instruction: 'Use multi-tool pliers to crimp down jagged metal or fiberglass splinters. Press both pole ends flush.',
          materialsNeeded: ['Multi-tool'],
          safetyWarning: 'Beware of sharp splinters.'
        },
        {
          stepNumber: 2,
          title: 'Position Center Splint Support',
          instruction: 'Center a 6-inch rigid repair sleeve, tent stake, or sturdy stick over the crack.',
          materialsNeeded: ['Repair Sleeve / Tent Stake']
        },
        {
          stepNumber: 3,
          title: 'Spiral Wrap Duct Tape Tightly',
          instruction: 'Wrap heavy-duty duct tape around the splint stick, pulling firmly with 5 overlapping layers.',
          materialsNeeded: ['Duct Tape']
        }
      ],
      batteryTips: ['Dim screen in field to preserve device battery'],
      voiceIntro: 'Offline tent pole splinting guide loaded.'
    }
  },
  {
    title: 'Trekking Boot Sole Delamination',
    subtitle: 'Prevent flap tripping on rough trail',
    protocol: {
      equipmentName: 'Trekking Boot Sole Patch',
      identifiedMaterial: 'Vibram Rubber & Leather',
      confidenceScore: 0.95,
      issueDescription: 'Tread separated from upper toe box',
      durabilityRating: 'Emergency Field Patch (Temporary)',
      requiredTools: ['Super Glue / Seam Sealer', 'Duct Tape', 'Paracord'],
      steps: [
        {
          stepNumber: 1,
          title: 'Clean Mud & Grit from Gap',
          instruction: 'Scrape out trail dirt from inside the separation gap with a knife or stick.',
          materialsNeeded: ['Multi-tool / Stick']
        },
        {
          stepNumber: 2,
          title: 'Apply Super Glue & Clamp Sole',
          instruction: 'Apply super glue inside gap and press sole against upper for 60 seconds.',
          materialsNeeded: ['Super Glue']
        },
        {
          stepNumber: 3,
          title: 'Lash Paracord Around Arch',
          instruction: 'Tie paracord tightly around the boot arch to maintain sole tension while hiking.',
          materialsNeeded: ['Paracord']
        }
      ],
      batteryTips: ['Enable speakerphone for hands-free boot binding'],
      voiceIntro: 'Offline boot repair guide ready.'
    }
  },
  {
    title: 'Down Jacket / Sleeping Bag Tear',
    subtitle: 'Stop insulation loss instantly',
    protocol: {
      equipmentName: 'Down Jacket / Sleeping Bag',
      identifiedMaterial: '20D Ripstop Nylon',
      confidenceScore: 0.99,
      issueDescription: 'Puncture tear spilling down feathers',
      durabilityRating: 'High Durability (Multi-day)',
      requiredTools: ['Duct Tape / Repair Patch', 'Multi-tool Scissors'],
      steps: [
        {
          stepNumber: 1,
          title: 'Stuff Loose Feathers Back Inside',
          instruction: 'Push loose down feathers back into the baffle tear with a blunt stick.',
          materialsNeeded: ['Blunt Stick']
        },
        {
          stepNumber: 2,
          title: 'Cut Patch with Rounded Corners',
          instruction: 'Cut repair tape extending 0.5 inches past the rip. Round all sharp corners.',
          materialsNeeded: ['Repair Tape', 'Scissors']
        },
        {
          stepNumber: 3,
          title: 'Press Patch Firmly with Hand Warmth',
          instruction: 'Press patch smooth from center to edges. Warm with your palm for 30 seconds.',
          materialsNeeded: ['Hand warmth']
        }
      ],
      batteryTips: ['Dim screen to stealth mode'],
      voiceIntro: 'Jacket tear repair ready.'
    }
  },
  {
    title: 'Backpack Strap Blowout',
    subtitle: 'Reattach torn load-bearing straps',
    protocol: {
      equipmentName: 'Backpack Shoulder Strap',
      identifiedMaterial: 'Heavy-duty Nylon Webbing',
      confidenceScore: 0.94,
      issueDescription: 'Shoulder strap tearing from backpack main body',
      durabilityRating: 'Emergency Field Patch (Temporary)',
      requiredTools: ['Paracord', 'Multi-tool Knife / Awl', 'Zip Ties'],
      steps: [
        {
          stepNumber: 1,
          title: 'Assess and Clean Tear Site',
          instruction: 'Remove backpack. Cut away any frayed threads around the torn strap point with your knife.',
          materialsNeeded: []
        },
        {
          stepNumber: 2,
          title: 'Puncture Lashing Holes',
          instruction: 'Use the awl on your multi-tool to safely poke two small holes through the heavy pack fabric and through the strap webbing.',
          materialsNeeded: []
        },
        {
          stepNumber: 3,
          title: 'Thread and Cinch Paracord',
          instruction: 'Thread a 2-foot loop of paracord or thick zip ties heavily through the holes, binding the strap to the pack body securely.',
          materialsNeeded: []
        }
      ],
      batteryTips: ['Keep volume up so you can hear while wrestling with pack weight'],
      voiceIntro: 'Backpack shoulder strap repair protocol loaded.'
    }
  },
  {
    title: 'Hydration Bladder Puncture',
    subtitle: 'Stop water reservoir leaks',
    protocol: {
      equipmentName: 'Hydration Bladder Reservoir',
      identifiedMaterial: 'Flexible TPU / Polyurethane',
      confidenceScore: 0.97,
      issueDescription: 'Pin-hole puncture or small slit leaking water',
      durabilityRating: 'Emergency Field Patch (Temporary)',
      requiredTools: ['Duct Tape / Repair Patch', 'Alcohol Wipe / Cloth'],
      steps: [
        {
          stepNumber: 1,
          title: 'Empty and Dry the Bladder',
          instruction: 'Drain water below the puncture line. Thoroughly wipe the outside plastic completely dry using an alcohol wipe or clean cloth.',
          materialsNeeded: []
        },
        {
          stepNumber: 2,
          title: 'Apply Sealing Patch',
          instruction: 'Apply a patch of Tenacious Tape or Duct Tape smoothly over the puncture from the outside.',
          materialsNeeded: []
        },
        {
          stepNumber: 3,
          title: 'Burnish and Test Seal',
          instruction: 'Rub your thumbnail firmly over the patch to remove all air bubbles and force the adhesive into the plastic.',
         materialsNeeded: []
        }
      ],
      batteryTips: ['Keep device away from leaking water'],
      voiceIntro: 'Hydration bladder leak repair loaded.'
    }
  }
];

export const OfflineGuide: React.FC<OfflineGuideProps> = ({ onSelectQuickRepair }) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-amber-400" />
        <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
          Offline Emergency Field Cheatsheets
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Zero cellular signal in the deep backcountry? Tap any emergency protocol below for instant hands-free voice guidance.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {OFFLINE_REPAIRS.map((item, idx) => (
          <div
            key={idx}
            onClick={() => onSelectQuickRepair(item.protocol)}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                {item.title}
              </span>
              <Zap className="w-4 h-4 text-amber-400 opacity-75 group-hover:opacity-100" />
            </div>
            <p className="text-[11px] text-slate-400 mb-3">{item.subtitle}</p>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase">
              Launch Voice Guide →
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
