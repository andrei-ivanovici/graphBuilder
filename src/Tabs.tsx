import React, {useMemo, useState} from 'react';
import {WFProcess, Branch} from "./model/steps";
import styled from "styled-components";

export interface TabsProps {
    process: WFProcess;
    onSelectChanged: (tab: TabDef) => void;
    onBranchChaged:(newBranch:Branch)=>void;
}

const Root = styled.div`
  display: flex;
  gap: 0.5rem;
`;


export type  TabDef = {
    id: string,
    name: string;
    type: "basic" | "approval";

}

const Tab = styled.div<{ selected: boolean }>`
  display: grid;
  place-items: center;
  grid-auto-flow: column;
  gap:1rem;
  border: 1px solid;
  padding: 3px;
  background: ${props => props.selected ? `#c2e8ba` : '#d3c2e1'};
  user-select: none;
  cursor: pointer;
`;

function useTabs(wfProcess: WFProcess) {
    return useMemo(() => {
        let watchdog = 1000;
        const {head, steps} = wfProcess;
        let currentStep = steps[head.endStep];
        const tabs = [];
        while (currentStep && watchdog-- >0) {
            const {id, name, prevStep, type} = currentStep;

            const tab: TabDef = {
                id,
                name,
                type,
            };
            tabs.push(tab);
            currentStep = steps[prevStep ?? ''];
        }
        if(watchdog < 0){
            console.warn("WAtchdog exhausted")
        }

        return tabs.reverse();
    }, [wfProcess]);
}
export  interface ApprovalSelectProps {
    value:string;
    onChange:(newValue:string)=>void;
}
function  ApprovalSelect  (props:ApprovalSelectProps){
    const [val, setVal] = useState('approve')
    const { onChange} =props
    const updateVal = (newVal:string)=>{
        setVal(newVal)
        onChange(newVal)
    }
    return <select value={val} onChange={e=>updateVal(e.target.value)}>
        <option value={"approve"} label={"Approve"}/>
        <option value={"deny"} label={"Deny"}/>
    </select>
}

export function Tabs(props: TabsProps) {
    const {process, onSelectChanged, onBranchChaged} = props;
    const {head,  branches}=process
    const tabs = useTabs(process);
    const [selected, setSelected] = useState(tabs[0]);
    const changeTab = (tab: TabDef) => {
        setSelected(tab);
        onSelectChanged(tab);
    };
    const changeBranch = (step:string, newValue:string)=>{
        const newBranch =branches.find(b=>b.ref===step && b.label===newValue)
        if(newBranch) {
            onBranchChaged({...newBranch})
        }
    }
    return <Root>
        {tabs.map(t =>
            <Tab key={t.id} selected={t === selected} onClick={() => changeTab(t)}>
                {t.name}
                {t.type==="approval" && <ApprovalSelect  value={head.label} onChange={args=>changeBranch(t.id,args)}/>}
            </Tab>
        )}
    </Root>;
}
