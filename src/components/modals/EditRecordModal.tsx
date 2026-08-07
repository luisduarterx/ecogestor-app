import RecordModal from "./RecordModal";
import { useRecord } from "../../utils/queries";

interface EditRecordModalProps {
  recordID: number;
  setIsOpen: (open: boolean) => void;
}

export default function EditRecordModal({
  recordID,
  setIsOpen,
}: EditRecordModalProps) {
  const recordQuery = useRecord(recordID);

  if (recordQuery.isPending) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-sm text-slate-400">
          Carregando dados do registro...
        </div>
      </div>
    );
  }
  if (recordQuery.isError || !recordQuery.data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs">
        <div className="rounded-2xl border border-rose-500/20 bg-slate-900 p-6 text-center">
          <p className="text-sm text-rose-400">
            Não foi possível carregar o registro.
          </p>
          <button
            onClick={() => setIsOpen(false)}
            className="mt-4 rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }
  return <RecordModal setIsOpen={setIsOpen} record={recordQuery.data} />;
}
