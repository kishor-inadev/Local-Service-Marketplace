#!/usr/bin/env bash
#
# Run automated API tests using Newman (Postman CLI)
#

set -e  # Exit on error

# Default values
COLLECTION_PATH="docs/Local-Service-Marketplace.postman_collection.json"
ENVIRONMENT_PATH="newman/newman.env.json"
OUTPUT_DIR="test-reports"
WAIT_FOR_SERVICES=false
BASE_URL=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${CYAN}$1${NC}"
}

success() {
    echo -e "${GREEN}$1${NC}"
}

warning() {
    echo -e "${YELLOW}$1${NC}"
}

error() {
    echo -e "${RED}$1${NC}" >&2
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--collection)
            COLLECTION_PATH="$2"
            shift 2
            ;;
        -e|--environment)
            ENVIRONMENT_PATH="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -w|--wait)
            WAIT_FOR_SERVICES=true
            shift
            ;;
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -c, --collection PATH    Path to Postman collection (default: docs/Local-Service-Marketplace.postman_collection.json)"
            echo "  -e, --environment PATH  Path to Newman environment (default: newman/newman.env.json)"
            echo "  -o, --output DIR         Output directory for reports (default: test-reports)"
            echo "  -w, --wait               Wait for services to be healthy before running tests"
            echo "  -u, --url BASE_URL       Override base URL (e.g., http://localhost:3500)"
            echo "  -h, --help               Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Check if Newman is installed
check_newman() {
    info "Checking if Newman is installed..."
    if command -v pnpm &> /dev/null && pnpm newman --version &> /dev/null; then
        version=$(pnpm newman --version)
        success "Newman found: $version"
        return 0
    elif command -v newman &> /dev/null; then
        version=$(newman --version)
        success "Newman found: $version"
        return 0
    else
        error "Newman is not installed. Please run 'pnpm install' in the project root."
        return 1
    fi
}

# Check required files exist
check_files() {
    info "Validating required files..."
    local errors=()

    if [ ! -f "$COLLECTION_PATH" ]; then
        errors+=("Collection file not found: $COLLECTION_PATH")
    fi

    if [ ! -f "$ENVIRONMENT_PATH" ]; then
        errors+=("Environment file not found: $ENVIRONMENT_PATH")
    fi

    if [ ${#errors[@]} -gt 0 ]; then
        for err in "${errors[@]}"; do
            error "$err"
        done
        return 1
    fi

    success "All required files exist."
    return 0
}

# Wait for services to be healthy
wait_for_services() {
    info "Waiting for all services to become healthy..."
    info "Maximum wait time: 120 seconds"

    local elapsed=0
    local max_wait=120
    local interval=5
    local services_health_url="http://localhost:3500/health/services"

    while [ $elapsed -lt $max_wait ]; do
        if curl -s -f "$services_health_url" > /dev/null 2>&1; then
            info "Services health endpoint is responding."
            # Additional check: parse response and verify all services report healthy
            # For now, basic connectivity check is sufficient
            success "All services appear to be healthy!"
            return 0
        fi

        sleep $interval
        elapsed=$((elapsed + interval))
        info "Still waiting... ($elapsed/$max_wait s)"
    done

    error "Services did not become healthy within $max_wait seconds."
    error "Check docker-compose logs for details."
    return 1
}

# Ensure output directory exists
ensure_output_dir() {
    if [ ! -d "$OUTPUT_DIR" ]; then
        info "Creating output directory: $OUTPUT_DIR"
        mkdir -p "$OUTPUT_DIR"
    fi
}

# Generate timestamped filename
get_timestamped_filename() {
    local extension="$1"
    local timestamp=$(date +%Y-%m-%d_%H%M%S)
    echo "report_${timestamp}${extension}"
}

# Run Newman tests
run_newman() {
    info "Running Newman tests..."
    info "Collection: $COLLECTION_PATH"
    info "Environment: $ENVIRONMENT_PATH"

    ensure_output_dir
    local html_report="$OUTPUT_DIR/$(get_timestamped_filename .html)"
    local json_report="$OUTPUT_DIR/$(get_timestamped_filename .json)"

    success "HTML Report: $html_report"
    info "JSON Report: $json_report"
    echo ""

    # Build arguments
    local newman_args=(
        "run" "$COLLECTION_PATH"
        "--environment" "$ENVIRONMENT_PATH"
        "--reporters" "cli,html,json"
        "--reporter-html-export" "$html_report"
        "--reporter-json-export" "$json_report"
        "--no-color"
    )

    if [ -n "$BASE_URL" ]; then
        newman_args+=("--global-var" "base_url=$BASE_URL")
        info "Using overridden base URL: $BASE_URL"
    fi

    info "Executing: pnpm newman ${newman_args[*]}"
    info "--------------------------------------------------"
    echo ""

    # Run Newman
    set +e
    if pnpm newman "${newman_args[@]}"; then
        set -e
        success "✅ All tests passed!"
        success "HTML Report: $html_report"
        info "Open the HTML report in your browser to see detailed results."
        return 0
    else
        local exit_code=$?
        set -e
        error "❌ Some tests failed. Exit code: $exit_code"
        error "HTML Report: $html_report"
        info "Review the report above or open the HTML file to see details."
        return $exit_code
    fi
}

# MAIN
main() {
    info "========================================"
    info "  Postman/Newman Test Runner"
    info "========================================"
    echo ""

    # Check Newman
    if ! check_newman; then
        exit 2
    fi

    # Check files
    if ! check_files; then
        exit 1
    fi

    # Override base URL in environment file if specified
    if [ -n "$BASE_URL" ]; then
        info "Overriding base_url to: $BASE_URL"
        # Use jq if available, otherwise skip
        if command -v jq &> /dev/null; then
            tmp_file=$(mktemp)
            jq --arg url "$BASE_URL" '.values[] |= if .key == "base_url" then .value = $url else . end' "$ENVIRONMENT_PATH" > "$tmp_file" && mv "$tmp_file" "$ENVIRONMENT_PATH"
        else
            warning "jq not installed - skipping base_url override in env file. Use collection variable override instead."
        fi
    fi

    # Wait for services if requested
    if [ "$WAIT_FOR_SERVICES" = true ]; then
        if ! wait_for_services; then
            exit 3
        fi
    else
        warning "Skipping service health check. Use -w to wait for services."
        warning "Ensure all services are running: docker-compose up -d"
        echo ""
    fi

    # Run tests
    run_newman
    exit $?
}

main "$@"
