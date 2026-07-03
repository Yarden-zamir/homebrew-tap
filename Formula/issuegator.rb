# typed: false
# frozen_string_literal: true

class Issuegator < Formula
  desc "Rust TUI GitHub issue explorer for the current repository"
  homepage "https://github.com/Yarden-zamir/issuegator"
  url "https://github.com/Yarden-zamir/issuegator/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "671fb92412678a541c714803f24b777409847c6c9b8c5c99333e4b649fc3f7b7"
  license "MIT"
  head "https://github.com/Yarden-zamir/issuegator.git", branch: "main"

  depends_on "rust" => :build
  depends_on "gh"

  def install
    system "cargo", "install", *std_cargo_args
  end

  test do
    assert_path_exists bin/"issuegator"
  end
end
