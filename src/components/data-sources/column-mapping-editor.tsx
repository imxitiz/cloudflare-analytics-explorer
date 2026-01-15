import { useState } from 'react';
import type { ClipboardEvent } from "react";
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, ArrowDown01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ANALYTICS_ENGINE_COLUMNS, getColumnType } from '@/data/mock-data-sources';
import type { ColumnMapping, ColumnType } from '@/types/dashboard';

interface ColumnMappingEditorProps {
  mappings: ColumnMapping[];
  onChange: (mappings: ColumnMapping[]) => void;
  className?: string;
}

const COLUMN_TYPE_COLORS: Record<ColumnType, string> = {
  blob: 'bg-blue-500/10 text-blue-600',
  double: 'bg-green-500/10 text-green-600',
  index: 'bg-purple-500/10 text-purple-600',
};

export function ColumnMappingEditor({
  mappings,
  onChange,
  className,
}: ColumnMappingEditorProps) {
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({
    blob: true,
    double: true,
    index: false,
  });

  const getMappingForColumn = (column: string) =>
    mappings.find((m) => m.sourceColumn === column);

  const handleMappingChange = (
    sourceColumn: string,
    friendlyName: string,
    description?: string
  ) => {
    const columnType = getColumnType(sourceColumn);
    if (!columnType) {
      return;
    }

    const existing = mappings.find((m) => m.sourceColumn === sourceColumn);

    if (friendlyName.trim() === '') {
      // Remove mapping if name is empty
      onChange(mappings.filter((m) => m.sourceColumn !== sourceColumn));
    } else if (existing) {
      // Update existing mapping
      onChange(
        mappings.map((m) =>
          m.sourceColumn === sourceColumn
            ? { ...m, friendlyName, description }
            : m
        )
      );
    } else {
      // Add new mapping
      onChange([
        ...mappings,
        { sourceColumn, friendlyName, columnType, description },
      ]);
    }
  };

  const handleRemoveMapping = (sourceColumn: string) => {
    onChange(mappings.filter((m) => m.sourceColumn !== sourceColumn));
  };

  const toggleType = (type: string) => {
    setExpandedTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  // When the user pastes comma-separated values into an input, distribute
  // the values across this section's columns starting at the pasted column.
  const handlePaste = async (
    e: ClipboardEvent<HTMLInputElement>,
    startColumn: string,
    columns: string[],
  ) => {
    try {
      // Safer clipboard access in case clipboardData isn't present on the synthetic event
      const clipboardData =
        e.clipboardData || (window as any).clipboardData;
      let text = clipboardData?.getData?.("text") ?? "";

      // Fallback: if the paste event didn't include clipboard text (some browsers/iframes),
      // try the async Clipboard API as a best-effort fallback.
      if (
        !text &&
        typeof navigator !== "undefined"
      ) {
        try {
          text = await navigator.clipboard.readText();
        } catch (_err) {
          // Ignore permission errors — we'll just not handle as CSV
          text = text || "";
        }
      }

      // Only handle paste that contains a comma (CSV-like)
      if (!text || !text.includes(",")) {
        // Not a CSV-style paste — allow normal paste to proceed
        return;
      }

      e.preventDefault();

      // If our own debug string was accidentally copied (user copied console output),
      // try to extract the actual pasted CSV payload from `text: "..."`.
      let csvText = text;
      const debugMatch = text.match(/text:\s*"([\s\S]*?)"/);
      if (debugMatch?.[1]) {
        csvText = debugMatch[1];
      }

      const values = csvText
        .split(",")
        .map((v: string) => v.trim())
        .filter(Boolean);

      if (values.length === 0) return;

      const startIndex = columns.indexOf(startColumn);

      // Merge all mapping updates and call onChange once to avoid overwriting
      // earlier updates due to repeated synchronous calls using a stale snapshot.
      const updatedByColumn: Record<string, ColumnMapping | undefined> = {};

      // Seed with existing mappings for columns outside this section and within it
      mappings.forEach((m) => {
        updatedByColumn[m.sourceColumn] = { ...m };
      });

      values.forEach((val: string, idx: number) => {
        const colIndex = startIndex + idx;
        if (colIndex >= columns.length) return;
        const srcColumn = columns[colIndex];
        const columnType = getColumnType(srcColumn) as ColumnType;
        updatedByColumn[srcColumn] = {
          sourceColumn: srcColumn,
          friendlyName: val,
          columnType,
        };
      });

      // Build final mappings array: keep original order but replace/append updated columns
      const remaining = mappings.filter(
        (m) => !columns.includes(m.sourceColumn),
      );
      const updatedInSection = columns
        .map((c) => updatedByColumn[c])
        .filter((m): m is ColumnMapping => !!m);

      onChange([...remaining, ...updatedInSection]);
    } catch (_err) {
      // Let the native paste happen if anything goes wrong
      return;
    }
  };

  const renderColumnSection = (
    type: 'blob' | 'double' | 'index',
    columns: string[],
    label: string
  ) => {
    const mappedCount = columns.filter((col) => getMappingForColumn(col)).length;

    return (
      <div key={type} className="border-b last:border-0">
        <button
          onClick={() => toggleType(type)}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted/50"
        >
          <HugeiconsIcon
            icon={expandedTypes[type] ? ArrowDown01Icon : ArrowRight01Icon}
            size={14}
            strokeWidth={2}
          />
          <span>{label}</span>
          <Badge variant="secondary" className="ml-auto">
            {mappedCount}/{columns.length}
          </Badge>
        </button>

        {expandedTypes[type] && (
          <div className="space-y-1 px-4 pb-3">
            {columns.map((column) => {
              const mapping = getMappingForColumn(column);
              return (
                <div
                  key={column}
                  className="flex items-center gap-2 rounded bg-muted/30 px-2 py-1.5"
                >
                  <Badge
                    className={cn(
                      "min-w-17.5 justify-center",
                      COLUMN_TYPE_COLORS[type],
                    )}
                  >
                    {column}
                  </Badge>
                  <span className="text-muted-foreground">→</span>
                  <Input
                    placeholder="Friendly name..."
                    value={mapping?.friendlyName || ""}
                    onChange={(e) =>
                      handleMappingChange(column, e.target.value)
                    }
                    onPaste={(e) =>
                      handlePaste(e, column, columns)
                    }
                    className="h-7 flex-1"
                  />
                  {mapping && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMapping(column)}
                      className="size-7 text-muted-foreground hover:text-destructive"
                    >
                      <HugeiconsIcon
                        icon={Delete02Icon}
                        size={14}
                        strokeWidth={2}
                      />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('rounded border', className)}>
      <div className="border-b bg-muted/50 px-4 py-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Column Mappings</span>
          <span className="text-xs text-muted-foreground">
            {mappings.length} mapped
          </span>
        </div>
      </div>

      <div className="max-h-[400px] overflow-auto">
        {renderColumnSection('blob', ANALYTICS_ENGINE_COLUMNS.blobs, 'Blob Columns (Text)')}
        {renderColumnSection('double', ANALYTICS_ENGINE_COLUMNS.doubles, 'Double Columns (Numbers)')}
        {renderColumnSection('index', ANALYTICS_ENGINE_COLUMNS.indexes, 'Index Columns')}
      </div>
    </div>
  );
}
