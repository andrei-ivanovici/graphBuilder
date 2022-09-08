import React, {useState, useMemo} from 'react';
import styled from "styled-components";
import {WFProcess, BasicStep, ApprovalStep, Branch, DesignerStep, newBranch} from "./model/steps";
import {nanoid} from "nanoid";
import produce from "immer";
import {Tabs, TabDef} from "./Tabs";
import {randSuperheroName, randFirstName} from "@ngneat/falso";
import {WfProcessViewer} from "./ProcessViewer/ProcessViewer";

const Root = styled.div`
  display: grid;
  grid-template-columns:  3fr 1fr;
`;

const Button = styled.button`
  height: 20px;
  width: 100px;
`;
const Playground = styled.div`
  height: 100vh;
  overflow: auto;
  border: 1px solid;
  background: #c3dbe7;
  padding: 5px;
  display: grid;
  grid-template-rows: max-content 1fr;
`;
const Viewer = styled.div`
  border: 1px solid;
  background: #9fa6b9;
  height: 100%;
  overflow: auto;
`;

const defaultHead: Branch = {
    id: nanoid(),
    ref: `master_${nanoid()}`,
    endStep: '',
    label: "next"
};
const defaultProcess={
    head: defaultHead,
    branches: [defaultHead],
    steps: {},
    startStepId: ''
};

function App() {
    const [wfProcess, setWfProcess] = useState<WFProcess>(defaultProcess);
    const [selectedStep, setSelectedStep] = useState<DesignerStep | undefined>();
    const json = useMemo(() => JSON.stringify(wfProcess, null, 2), [wfProcess]);
    const selectedJson = useMemo(() => JSON.stringify(selectedStep, null, 2), [selectedStep]);
    const saveHeadDraft = (wfProcess: WFProcess) => {
        const {head, branches} = wfProcess;
        const idx = branches.findIndex(b => b.id === head.id);
        if (idx !== -1) {
            branches.splice(idx, 1, head);
        }
    };
    const onAdd = () => {
        const newProcess = produce(wfProcess, draft => {
            const {head, steps} = draft;
            const stepName = randFirstName();
            const newStep: BasicStep = {
                id: nanoid(),
                type: "basic",
                prevStep: head.endStep,
                name: stepName
            };
            const prevStep: any = steps[head.endStep];

            steps[newStep.id] = newStep;
            head.endStep = newStep.id;
            if (prevStep) {
                if(prevStep.id === head.ref) {
                    prevStep[head.label as any] = newStep.id;
                }
                else{
                    prevStep.nextStep=newStep.id;
                }
            }
            if(!newStep.prevStep){
                draft.startStepId=newStep.id
            }

        });
        setWfProcess(newProcess);

    };
    const onAddApproval = () => {
        const newProcess = produce(wfProcess, draft => {
            const stepName = randSuperheroName();
            const newStep: ApprovalStep = {
                id: `${stepName}_${nanoid()}`,
                type: "approval",
                name: stepName,
                approve: '',
                deny: ''

            };
            const {branches, head, steps} = draft;
            const approveBranch = newBranch("approve", newStep.id);
            const denyBranch = newBranch("deny", newStep.id);
            branches.push(approveBranch, denyBranch);

            const prevStep: any = steps[head.endStep];
            if (prevStep) {
                if (prevStep.id === head.ref) {
                    prevStep[head.label] = newStep.id;
                } else {
                    prevStep.nextStep = newStep.id;
                }
                newStep.prevStep = head.endStep;
            }

            head.endStep = newStep.id;
            saveHeadDraft(draft);
            draft.head = approveBranch;
            steps[newStep.id] = newStep;
            if(!newStep.prevStep){
                draft.startStepId=newStep.id
            }
        });
        setWfProcess(newProcess);
    };
    const changeStep = (tab: TabDef) => {
        setSelectedStep(wfProcess.steps[tab.id]);
    };

    const removeStep = () => {
    };

    const changeBranch = (newBranch: Branch) => {
        const newProcess = produce(wfProcess, draft => {
            const {head, branches, steps} = draft;
            const index = branches.findIndex(b => b.id === head.id);
            branches.splice(index, 1, head);
            let watchdog = 100;

            let finalHead: Branch | undefined = newBranch;
            let finalSep: DesignerStep | undefined = steps[newBranch.endStep];
            while (finalSep && finalSep?.type === "approval" && watchdog-- > 0 && finalHead?.ref !== finalHead?.endStep) {
                const finalSep1:DesignerStep|undefined = finalSep;
                finalHead = branches.find(b => b.ref === finalSep1!.id);
                const candidate:any = steps[finalHead?.ref ?? ''];
                finalSep = candidate !== finalSep ? candidate : undefined;
            }

            draft.head = finalHead ?? newBranch;
        });
        setWfProcess(newProcess);
    };


    return (
        <Root>
            <Playground>
                <div>
                    <Button onClick={onAdd}>Add Basic</Button>
                    <Button onClick={onAddApproval}>Add Approval</Button>
                    <Tabs process={wfProcess} onSelectChanged={changeStep} onBranchChaged={changeBranch}/>
                     <WfProcessViewer wfProcess={wfProcess}/>
                </div>
                <Viewer>
                    <Button onClick={removeStep}>Remove</Button>
                    <pre>{selectedJson}</pre>
                </Viewer>
            </Playground>
            <Viewer>
                <pre>{json}</pre>
            </Viewer>

        </Root>
    );
}

export default App;
