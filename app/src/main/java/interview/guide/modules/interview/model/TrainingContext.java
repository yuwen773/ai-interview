package interview.guide.modules.interview.model;

import java.util.ArrayList;
import java.util.List;

public record TrainingContext(
    List<String> weakPointLines,
    List<String> lowMasteryLines,
    List<String> behaviorSignalLines,
    List<String> patternLines,
    List<String> strongPointLines
) {
    public TrainingContext {
        weakPointLines = copyOrEmpty(weakPointLines);
        lowMasteryLines = copyOrEmpty(lowMasteryLines);
        behaviorSignalLines = copyOrEmpty(behaviorSignalLines);
        patternLines = copyOrEmpty(patternLines);
        strongPointLines = copyOrEmpty(strongPointLines);
    }

    public static TrainingContext empty() {
        return new TrainingContext(List.of(), List.of(), List.of(), List.of(), List.of());
    }

    public boolean isEmpty() {
        return weakPointLines.isEmpty()
            && lowMasteryLines.isEmpty()
            && behaviorSignalLines.isEmpty()
            && patternLines.isEmpty()
            && strongPointLines.isEmpty();
    }

    public String toPromptText() {
        if (isEmpty()) {
            return "";
        }
        List<String> lines = new ArrayList<>();
        lines.add("用户画像上下文：");
        lines.addAll(weakPointLines);
        lines.addAll(lowMasteryLines);
        lines.addAll(behaviorSignalLines);
        lines.addAll(patternLines);
        lines.addAll(strongPointLines);
        return String.join("\n", lines);
    }

    private static List<String> copyOrEmpty(List<String> values) {
        return values != null ? List.copyOf(values) : List.of();
    }
}
