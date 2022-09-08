import {nanoid} from "nanoid";

export interface Step {
    id: string;
    type: "basic" | "approval";
    prevStep?:string;
    name:string
}

export interface BasicStep extends Step {
    type: "basic";
    nextStep? : string;
}

export interface ApprovalStep extends Step {
    type: "approval";
    approveStep? : string;
    denyStep? : string;
}

export type  DesignerStep =  ApprovalStep|BasicStep;

export  interface  Head {
    id:string;
    endStep:string;
}
export interface Branch extends  Head{
    parent?:string;
    ref:string;
    label:string
    child?:string
}


export interface WFProcess {
    steps: Record<string, DesignerStep>;
    branches: Branch[]
    head: Branch;
    startStepId:string;
}

export  function  newBranch(label:string, ref:string):Branch{
    return  {
        ref,
        label,
        endStep:ref,
        id:nanoid()

    }
}
export  function createHead (label:string, endStep:string): Head{
    return {
        endStep,
        id:nanoid()
    }
}
