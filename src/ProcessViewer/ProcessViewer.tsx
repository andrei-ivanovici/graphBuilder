import React, {useMemo} from 'react';
import styled from "styled-components";
import {WFProcess, DesignerStep} from "../model/steps";
import {nanoid} from "nanoid";
import ReactFlow, {Background} from "react-flow-renderer";
import {getLayoutedElements} from "./graphBuilder";

const Root = styled.div`
  display: grid;

  grid-template-columns: 3fr  1fr;

`;

const StyledFlow = styled(ReactFlow)`
  height: 100vh;
  background: white;
`;

export interface WfProcessViewerProps {
    wfProcess: WFProcess;
}

function traverseGraph(step: DesignerStep, wfProcess: WFProcess) {
    const {steps} = wfProcess;
    let pointer: DesignerStep | undefined = step;
    const nodes: any[] = [];
    const connections: any[] = [];
    while (pointer) {
        nodes.push({
            name: pointer.name,
            id: pointer.id,
            data: {
                label: pointer.name,
            },
            position: {x: 0, y: 0}

        });
        if (pointer.prevStep) {
            connections.push({
                id: nanoid(),
                source: pointer.prevStep,
                target: pointer.id
            });
        }

        switch (pointer.type) {
            case "basic": {
                pointer = steps[pointer.nextStep ?? ''];

                break;
            }
            case "approval": {


                const approvalStep = steps[pointer.approve ?? ''];
                const denyStep = steps[pointer.deny ?? ''];

                if (approvalStep !== pointer) {
                    const {
                        edges: approveConnections,
                        nodes: approveNodes
                    } = traverseGraph(approvalStep, wfProcess);
                    nodes.push(...approveNodes);
                    connections.push(...approveConnections);
                }


                if (denyStep !== pointer) {
                    const {
                        edges: denyConnections,
                        nodes: denyNodes
                    } = traverseGraph(denyStep, wfProcess);
                    nodes.push(...denyNodes);
                    connections.push(...denyConnections);
                }

                pointer = undefined;
                nodes.push();
            }
        }
    }
    return getLayoutedElements(nodes, connections);
}

export function WfProcessViewer(props: WfProcessViewerProps) {
    const {wfProcess} = props;
    const {
        nodes, json
        , edges
    } = useMemo(() => {
        const expandedBranches = traverseGraph(wfProcess.steps[wfProcess.startStepId], wfProcess);
        const {nodes, edges} = expandedBranches;
        const json = JSON.stringify(expandedBranches, null, 2);
        return {
            nodes,
            json,
            edges
        };
    }, [wfProcess]);
    return <div>
        <h1>Viewer</h1>
        <Root>
            <StyledFlow nodes={nodes}
                        edges={edges} fitView>
                <Background color="red" gap={16}/>
            </StyledFlow>
            <div>
            <pre>
                {json}
            </pre>
            </div>
        </Root>
    </div>;
}
